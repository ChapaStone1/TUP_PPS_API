const db = require('../db/db')
const ResponseMessage = require('../models/ResponseMessage')
const ErrorMessage = require('../models/ErrorMessage')
const CustomStatusMessage = require('../models/CustomStatusMessage')
const bcrypt = require('bcrypt');

// Obtener perfil del usuario (médico)
const obtenerPerfil = (req, res) => {
  const idUsuario = req.user.id

  const query = `
    SELECT 
      u.id, u.nombre, u.dni, u.sexo, u.fecha_nac, u.telefono, u.email, u.tipo,
      mi.matricula, mi.consultorio, mi.especialidad_id,
      e.nombre AS especialidad
    FROM usuario u
    LEFT JOIN medico_info mi ON u.id = mi.usuario_id
    LEFT JOIN especialidad e ON mi.especialidad_id = e.id
    WHERE u.id = ?
  `

  db.get(query, [idUsuario], (err, row) => {
    if (err) return res.status(500).json(ErrorMessage.from('Error al obtener perfil del médico'))
    if (!row) return res.status(404).json(CustomStatusMessage.from(null, 404, 'Médico no encontrado'))
    res.status(200).json(ResponseMessage.from(row))
  })
}


const actualizarPerfil = (req, res) => {
  const idUsuario = req.user.id;
  const {
    nombre,
    dni,
    sexo,
    fecha_nac,
    telefono,
    email,
    password,
    matricula,
    consultorio,
    especialidad_id
  } = req.body;

  // Validar que teléfono sea número
  const telefonoInt = parseInt(telefono);
  if (isNaN(telefonoInt)) {
    return res.status(400).json(ErrorMessage.from('El campo "telefono" debe ser un número válido'));
  }

  // Encriptar contraseña si se manda
  if (password && password.trim() !== '') {
    bcrypt.hash(password, 6, (err, hash) => {
      if (err) {
        return res.status(500).json(ErrorMessage.from('Error al encriptar contraseña'));
      }
      actualizarUsuario(hash);
    });
  } else {
    actualizarUsuario(); // sin cambiar contraseña
  }

  const actualizarUsuario = (hash = null) => {
    const queryUsuario = hash
      ? `UPDATE usuario SET nombre = ?, dni = ?, sexo = ?, fecha_nac = ?, telefono = ?, email = ?, password = ? WHERE id = ?`
      : `UPDATE usuario SET nombre = ?, dni = ?, sexo = ?, fecha_nac = ?, telefono = ?, email = ? WHERE id = ?`;

    const paramsUsuario = hash
      ? [nombre, dni, sexo, fecha_nac, telefonoInt, email, hash, idUsuario]
      : [nombre, dni, sexo, fecha_nac, telefonoInt, email, idUsuario];

    db.run(queryUsuario, paramsUsuario, function (err) {
      if (err) {
        console.error('Error al actualizar usuario:', err);
        return res.status(500).json(ErrorMessage.from('Error al actualizar datos del usuario'));
      }

      if (this.changes === 0) {
        return res.status(404).json(CustomStatusMessage.from(null, 404, 'Usuario no encontrado'));
      }

      // Actualizar info médica
      db.run(
        `UPDATE medico_info SET matricula = ?, consultorio = ?, especialidad_id = ? WHERE usuario_id = ?`,
        [matricula, consultorio, especialidad_id, idUsuario],
        function (err) {
          if (err) {
            console.error('Error al actualizar médico:', err);
            return res.status(500).json(ErrorMessage.from('Error al actualizar datos del médico'));
          }

          res
            .status(200)
            .json(ResponseMessage.from({ message: 'Perfil del médico actualizado correctamente' }));
        }
      );
    });
  };
};


  // Obtener todas las especialidades
const obtenerEspecialidades = (req, res) => {
  const query = `SELECT id, nombre FROM especialidad ORDER BY nombre`

  db.all(query, [], (err, filas) => {
    if (err) {
      return res.status(500).json(ErrorMessage.from('Error al obtener las especialidades'))
    }
    res.status(200).json(ResponseMessage.from(filas))
  })
}

// Obtener todos los pacientes (médico) y por query busca por DNI
const allPacientes = (req, res) => {
  const idUsuario = req.user.id;
  const { dni, limit, offset } = req.query;
  console.log("Fetching pacientes con limit:", req.query.limit, "y offset:", req.query.offset);

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row)
      return res.status(500).json(ErrorMessage.from('Error al verificar permisos'));

    if (row.tipo !== 'medico')
      return res.status(403).json(CustomStatusMessage.from(null, 403, 'No autorizado'));

    // Construcción dinámica del SQL
    let query = `
      SELECT 
        u.id, u.nombre, u.dni, u.sexo, u.fecha_nac, u.telefono, u.email, 
        pi.grupo_sanguineo, pi.obra_social
      FROM usuario u
      LEFT JOIN paciente_info pi ON u.id = pi.usuario_id
      WHERE u.tipo = 'paciente'
    `;
    const params = [];

    if (dni) {
      query += ' AND u.dni LIKE ?';
      params.push(`%${dni}%`);
    }

    query += ' ORDER BY u.nombre';

    // Limit y offset (paginación)
    if (limit && !isNaN(parseInt(limit))) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));

      if (offset && !isNaN(parseInt(offset))) {
        query += ' OFFSET ?';
        params.push(parseInt(offset));
      }
    }

    db.all(query, params, async (err, pacientes) => {
      if (err)
        return res.status(500).json(ErrorMessage.from('Error al obtener los pacientes'));

      // Historia clínica por paciente
      const pacientesConHistoria = await Promise.all(
        pacientes.map((paciente) => {
          return new Promise((resolve, reject) => {
            db.all(
              `
              SELECT hc.id, hc.fecha, hc.medicacion, hc.nota,
                     u.id AS medico_id, u.nombre AS medico_nombre
              FROM historia_clinica hc
              LEFT JOIN usuario u ON u.id = hc.medico_id
              WHERE hc.usuario_id = ?
              ORDER BY hc.fecha DESC
              `,
              [paciente.id],
              (err, historia) => {
                if (err) return reject(err);

                const historiaFormateada = historia.map((entry) => ({
                  id: entry.id,
                  fecha: entry.fecha,
                  medicacion: entry.medicacion,
                  nota: entry.nota,
                  medico: {
                    id: entry.medico_id,
                    nombre: entry.medico_nombre,
                  },
                }));

                resolve({ ...paciente, historia_clinica: historiaFormateada });
              }
            );
          });
        })
      );

      res.status(200).json(ResponseMessage.from(pacientesConHistoria));
    });
  });
};




// Buscar paciente por DNI (médico)
const buscarPacientePorDNI = (req, res) => {
  const idUsuario = req.user.id
  const { dni } = req.params

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row) return res.status(500).json(ErrorMessage.from('Error al verificar permisos'))
    if (row.tipo !== 'medico') return res.status(403).json(CustomStatusMessage.from(null, 403, 'No autorizado'))

    db.get(`
      SELECT u.id, u.nombre, u.dni, u.sexo, u.fecha_nac, u.telefono, u.email, pi.grupo_sanguineo, pi.obra_social
      FROM usuario u
      LEFT JOIN paciente_info pi ON u.id = pi.usuario_id
      WHERE u.dni = ? AND u.tipo = 'paciente'
    `, [dni], (err, paciente) => {
      if (err) return res.status(500).json(ErrorMessage.from('Error al buscar paciente'))
      if (!paciente) return res.status(404).json(CustomStatusMessage.from(null, 404, 'Paciente no encontrado'))
      res.status(200).json(ResponseMessage.from(paciente))
    })
  })
}

// Crear médico (admin)
const cargarMedico = (req, res) => {
  const idAdmin = req.user.id
  const { nombre, dni, sexo, fecha_nac, telefono, email, password, matricula, consultorio, especialidad_id } = req.body

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idAdmin], (err, row) => {
    if (err || !row) return res.status(500).json(ErrorMessage.from('Error al verificar permisos'))
    if (row.tipo !== 'medico') return res.status(403).json(CustomStatusMessage.from(null, 403, 'No autorizado'))

    db.run(`
      INSERT INTO usuario (nombre, dni, sexo, fecha_nac, telefono, tipo, email, password)
      VALUES (?, ?, ?, ?, ?, 'medico', ?, ?)
    `, [nombre, dni, sexo, fecha_nac, telefono, email, password], function (err) {
      if (err) return res.status(500).json(ErrorMessage.from('Error al registrar médico'))
      const medicoId = this.lastID

      db.run(`
        INSERT INTO medico_info (usuario_id, matricula, consultorio, especialidad_id)
        VALUES (?, ?, ?, ?)
      `, [medicoId, matricula, consultorio, especialidad_id], function (err) {
        if (err) return res.status(500).json(ErrorMessage.from('Error al guardar info adicional del médico'))
        res.status(201).json(ResponseMessage.from({ message: 'Médico creado correctamente', id: medicoId }, 201))
      })
    })
  })
}

// Eliminar paciente (admin)
const eliminarPaciente = (req, res) => {
  const idAdmin = req.user.id
  const idPaciente = req.params.id

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idAdmin], (err, row) => {
    if (err || !row) return res.status(500).json(ErrorMessage.from('Error al verificar permisos'))
    if (row.tipo !== 'medico') return res.status(403).json(CustomStatusMessage.from(null, 403, 'No autorizado'))

    db.run(`DELETE FROM usuario WHERE id = ? AND tipo = 'paciente'`, [idPaciente], function (err) {
      if (err) return res.status(500).json(ErrorMessage.from('Error al eliminar paciente'))
      if (this.changes === 0)
        return res.status(404).json(CustomStatusMessage.from(null, 404, 'Paciente no encontrado'))

      res.status(200).json(ResponseMessage.from({ message: 'Paciente eliminado correctamente' }))
    })
  })
}

// Cargar consulta médica (médico)
const cargarConsulta = (req, res) => {
  const idMedico = req.user.id
  const idPaciente = req.params.id
  const { nota, medicacion } = req.body

  if (!nota || !medicacion) {
    return res.status(400).json(CustomStatusMessage.from(null, 400, 'Debe completar los campos nota y medicación'))
  }

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idMedico], (err, medico) => {
    if (err || !medico) return res.status(500).json(ErrorMessage.from('Error al verificar permisos del médico'))
    if (medico.tipo !== 'medico')
      return res.status(403).json(CustomStatusMessage.from(null, 403, 'Solo los médicos pueden cargar consultas'))

    db.get(`SELECT id FROM usuario WHERE id = ? AND tipo = 'paciente'`, [idPaciente], (err, paciente) => {
      if (err) return res.status(500).json(ErrorMessage.from('Error al verificar paciente'))
      if (!paciente)
        return res.status(404).json(CustomStatusMessage.from(null, 404, 'Paciente no encontrado o no válido'))

      const fecha = new Date().toISOString().split('T')[0]

      db.run(`
        INSERT INTO historia_clinica (usuario_id, medico_id, fecha, medicacion, nota)
        VALUES (?, ?, ?, ?, ?)
      `, [idPaciente, idMedico, fecha, medicacion, nota], function (err) {
        if (err) return res.status(500).json(ErrorMessage.from('Error al cargar la consulta'))
        res.status(201).json(ResponseMessage.from({ message: 'Consulta agregada correctamente', id: this.lastID }, 201))
      })
    })
  })
}

// Ver historia clínica de un paciente (médico o el mismo paciente)
const verHistoriaClinica = (req, res) => {
  const idUsuario = req.user.id
  const idPaciente = req.params.id

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row) return res.status(500).json(ErrorMessage.from('Error al verificar permisos'))
    const tipo = row.tipo

    if (tipo !== 'medico' && idUsuario !== parseInt(idPaciente)) {
      return res.status(403).json(CustomStatusMessage.from(null, 403, 'No autorizado'))
    }

    db.all(`
      SELECT 
        hc.id, 
        hc.fecha, 
        hc.nota, 
        hc.medicacion, 
        u.nombre AS medico,
        mi.consultorio,
        e.nombre AS especialidad
      FROM historia_clinica hc
      LEFT JOIN usuario u ON hc.medico_id = u.id
      LEFT JOIN medico_info mi ON u.id = mi.usuario_id
      LEFT JOIN especialidad e ON mi.especialidad_id = e.id
      WHERE hc.usuario_id = ?
      ORDER BY hc.fecha DESC
    `, [idPaciente], (err, rows) => {
      if (err) return res.status(500).json(ErrorMessage.from('Error al obtener historia clínica'))
      res.status(200).json(ResponseMessage.from(rows))
    })
  })
}

module.exports = {
  obtenerPerfil,
  actualizarPerfil,
  obtenerEspecialidades,
  cargarMedico,
  cargarConsulta,
  allPacientes,
  buscarPacientePorDNI,
  eliminarPaciente,
  verHistoriaClinica
}