const db = require('../db/db')
const ResponseMessage = require('../models/ResponseMessage')
const ErrorMessage = require('../models/ErrorMessage')
const CustomStatusMessage = require('../models/CustomStatusMessage')
const bcrypt = require('bcrypt')
const GeneralValidator = require('../validators/GeneralValidator');

// Crear médico (admin)
const cargarMedico = async (req, res) => {
  const idAdmin = req.user.id;
  const {
    nombre,
    apellido,
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

  if (
    !nombre || !apellido || !dni || !sexo || !fecha_nac ||
    !email || !telefono || !password || !matricula || !consultorio || !especialidad_id
  ) {
    return res.status(400).json(
      CustomStatusMessage.from(null, 400, 'Faltan campos obligatorios')
    );
  }

  // Validar si el usuario actual es admin
  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idAdmin], async (err, row) => {
    if (err || !row) {
      return res.status(500).json(ErrorMessage.from('Error al verificar permisos'));
    }

    if (row.tipo !== 'admin') {
      return res.status(403).json(CustomStatusMessage.from(null, 403, 'No autorizado'));
    }

    // Validaciones de DNI, email 
    try {
      const { valid, errors } = await GeneralValidator.validateRegister({ dni, email });

      if (!valid) {
        return res.status(400).json(CustomStatusMessage.from(null, 400, errors.join(', ')));
      }
    } catch (validationError) {
      return res.status(500).json(ErrorMessage.from(validationError));
    }

    if (!GeneralValidator.validarEmailFormato(email)) {
      return res.status(400).json(
        CustomStatusMessage.from(null, 400, 'Formato de correo inválido')
      );
    }

    if (!GeneralValidator.validarPasswordSegura(password)) {
      return res.status(400).json(
        CustomStatusMessage.from(null, 400, 'La contraseña debe tener al menos 6 caracteres')
      );
    }


    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json(ErrorMessage.from('Error al encriptar contraseña'));
      }

      db.run(`
        INSERT INTO usuario (nombre, apellido, dni, sexo, fecha_nac, telefono, tipo, email, password)
        VALUES (?, ?, ?, ?, ?, ?, 'medico', ?, ?)
      `, [nombre, apellido, dni, sexo, fecha_nac, telefono, email, hashedPassword], function (err) {
        if (err) {
          return res.status(500).json(ErrorMessage.from('Error al registrar médico'));
        }

        const medicoId = this.lastID;

        db.run(`
          INSERT INTO medico_info (usuario_id, matricula, consultorio, especialidad_id, habilitado)
          VALUES (?, ?, ?, ?, 1)
        `, [medicoId, matricula, consultorio, especialidad_id], function (err) {
          if (err) {
            return res.status(500).json(ErrorMessage.from('Error al guardar info adicional del médico'));
          }

          res.status(201).json(ResponseMessage.from({
            message: 'Médico creado correctamente',
            id: medicoId
          }, 201));
        });
      });
    });
  });
}


// Eliminar paciente (admin)
const eliminarPaciente = (req, res) => {
  const idAdmin = req.user.id
  const idPaciente = req.params.id

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idAdmin], (err, row) => {
    if (err || !row) return res.status(500).json(ErrorMessage.from('Error al verificar permisos'))
    if (row.tipo !== 'admin') return res.status(403).json(CustomStatusMessage.from(null, 403, 'No autorizado'))

    db.run(`DELETE FROM usuario WHERE id = ? AND tipo = 'paciente'`, [idPaciente], function (err) {
      if (err) return res.status(500).json(ErrorMessage.from('Error al eliminar paciente'))
      if (this.changes === 0)
        return res.status(404).json(CustomStatusMessage.from(null, 404, 'Paciente no encontrado'))

      res.status(200).json(ResponseMessage.from({ message: 'Paciente eliminado correctamente' }))
    })
  })
}

const cambiarHabilitacionMedico = (req, res) => {
  const idAdmin = req.user.id;
  const idMedico = req.params.id;

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idAdmin], (err, row) => {
    if (err || !row) {
      return res.status(500).json(ErrorMessage.from('Error al verificar permisos'));
    }

    if (row.tipo !== 'admin') {
      return res.status(403).json(CustomStatusMessage.from(null, 403, 'No autorizado'));
    }

    db.get(`SELECT habilitado FROM medico_info WHERE usuario_id = ?`, [idMedico], (err, medico) => {
      if (err) {
        return res.status(500).json(ErrorMessage.from('Error al obtener estado del médico'));
      }

      if (!medico) {
        return res.status(404).json(CustomStatusMessage.from(null, 404, 'Médico no encontrado'));
      }

      const nuevoEstado = medico.habilitado === 1 ? 0 : 1;

      // Actualizar el estado
      db.run(`UPDATE medico_info SET habilitado = ? WHERE usuario_id = ?`, [nuevoEstado, idMedico], function (err) {
        if (err) {
          return res.status(500).json(ErrorMessage.from('Error al actualizar estado del médico'));
        }

        const mensaje = nuevoEstado === 1
          ? 'Médico habilitado correctamente'
          : 'Médico deshabilitado correctamente';

        res.status(200).json(ResponseMessage.from({ message: mensaje }));
      });
    });
  });
};

// Obtener todos los médicos 
const listarMedicos = (req, res) => {
  const idAdmin = req.user.id;

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idAdmin], (err, row) => {
    if (err || !row) {
      return res.status(500).json(ErrorMessage.from('Error al verificar permisos'));
    }

    if (row.tipo !== 'admin') {
      return res.status(403).json(CustomStatusMessage.from(null, 403, 'No autorizado'));
    }

    const query = `
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.dni,
        u.sexo,
        u.fecha_nac,
        u.telefono,
        u.email,
        mi.matricula,
        mi.consultorio,
        mi.habilitado,
        e.id AS especialidad_id,
        e.nombre AS especialidad_nombre
      FROM usuario u
      LEFT JOIN medico_info mi ON u.id = mi.usuario_id
      LEFT JOIN especialidad e ON mi.especialidad_id = e.id
      WHERE u.tipo = 'medico'
      ORDER BY u.apellido, u.nombre
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        return res.status(500).json(ErrorMessage.from('Error al obtener la lista de médicos'));
      }

      res.status(200).json(ResponseMessage.from(rows));
    });
  });
};

const allUsers = (req, res) => {
  const idUsuario = req.user.id;
  const { dni, limit, offset } = req.query;

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row)
      return res.status(500).json(ErrorMessage.from('Error al verificar permisos'));

    if (row.tipo !== 'admin')
      return res.status(403).json(CustomStatusMessage.from(null, 403, 'No autorizado'));

    let query = `
      SELECT 
        id, nombre, apellido, dni, sexo, fecha_nac, telefono, email, tipo
      FROM usuario
    `;

    const params = [];
    const conditions = [];

    if (dni) {
      conditions.push('dni LIKE ?');
      params.push(`%${dni}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY apellido, nombre';

    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    if (!isNaN(parsedLimit)) {
      query += ' LIMIT ?';
      params.push(parsedLimit);

      if (!isNaN(parsedOffset)) {
        query += ' OFFSET ?';
        params.push(parsedOffset);
      }
    }

    db.all(query, params, (err, rows) => {
      if (err)
        return res.status(500).json(ErrorMessage.from('Error al obtener usuarios'));

      res.status(200).json(ResponseMessage.from(rows));
    });
  });
};


const resetearPassword = (req, res) => {
  const idAdmin = req.user.id;
  const idUsuarioTarget = req.params.id;

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idAdmin], (err, adminRow) => {
    if (err || !adminRow)
      return res.status(500).json(ErrorMessage.from('Error al verificar permisos'));

    if (adminRow.tipo !== 'admin')
      return res.status(403).json(CustomStatusMessage.from(null, 403, 'No autorizado'));

    db.get(`SELECT dni FROM usuario WHERE id = ?`, [idUsuarioTarget], async (err, userRow) => {
      if (err || !userRow)
        return res.status(404).json(ErrorMessage.from('Usuario no encontrado'));

      const nuevaClave = 'clave' + userRow.dni;

      try {
        const hashedPassword = await bcrypt.hash(nuevaClave, 10);

        db.run(`UPDATE usuario SET password = ? WHERE id = ?`, [hashedPassword, idUsuarioTarget], function(err) {
          if (err)
            return res.status(500).json(ErrorMessage.from('Error al actualizar contraseña'));

          res.status(200).json(ResponseMessage.from(`Contraseña restablecida para el usuario ${idUsuarioTarget}, password: "${nuevaClave}"`));
        });
      } catch (e) {
        res.status(500).json(ErrorMessage.from('Error al encriptar la contraseña'));
      }
    });
  });
}

module.exports = {
  cargarMedico,
  eliminarPaciente,
  cambiarHabilitacionMedico,
  listarMedicos,
  resetearPassword,
  allUsers
}