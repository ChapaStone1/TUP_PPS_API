const db = require('../db/db')
const ResponseMessage = require('../models/ResponseMessage')
const ErrorMessage = require('../models/ErrorMessage')
const CustomStatusMessage = require('../models/CustomStatusMessage')
const GeneralValidator = require('../validators/GeneralValidator');
const bcrypt = require('bcrypt')

// Obtener perfil del paciente (solo si es paciente)
const obtenerPerfilPaciente = (req, res) => {
  const idUsuario = req.user.id

  const query = `
    SELECT 
      u.id, u.nombre, u.apellido, u.dni, u.sexo, u.fecha_nac, u.telefono, u.email,
      pi.grupo_sanguineo, pi.obra_social
    FROM usuario u
    LEFT JOIN paciente_info pi ON u.id = pi.usuario_id
    WHERE u.id = ? AND u.tipo = 'paciente'
  `

  db.get(query, [idUsuario], (err, row) => {
    if (err)
      return res.status(500).json(ErrorMessage.from('Error al obtener perfil'))

    if (!row)
      return res.status(404).json(CustomStatusMessage.from(null, 404, 'Paciente no encontrado'))

    res.status(200).json(ResponseMessage.from(row))
  })
}

// Actualizar perfil del paciente (solo el mismo paciente)
const actualizarPerfilPaciente = async (req, res) => {
  const idUsuario = req.user.id;
  const {
    nombre,
    apellido,
    sexo,
    fecha_nac,
    telefono,
    email,
    password,
    grupo_sanguineo,
    obra_social,
    dni // llega solo para validación, no se actualiza
  } = req.body;

  try {
    if (
      !nombre || !apellido || !dni || !sexo || !fecha_nac ||
      !email || !telefono || !password || !grupo_sanguineo || !obra_social
    ) {
      return res.status(400).json(
        CustomStatusMessage.from(null, 400, 'Faltan campos obligatorios')
      );
    }

    // Verificar que el DNI no haya cambiado
    const row = await new Promise((resolve, reject) => {
      db.get(`SELECT dni FROM usuario WHERE id = ? AND tipo = 'paciente'`, [idUsuario], (err, row) => {
        if (err) return reject('Error al verificar DNI original');
        if (!row) return reject('Paciente no encontrado');
        resolve(row);
      });
    });

    if (dni && dni !== row.dni) {
      return res.status(400).json(
        CustomStatusMessage.from(null, 400, 'No se permite cambiar el DNI')
      );
    }

    // Validar que el email no esté en uso por otro usuario
    const emailDisponible = await GeneralValidator.isEmailAvailableForUpdate(email, idUsuario);
    if (!emailDisponible) {
      return res.status(400).json(
        CustomStatusMessage.from(null, 400, 'El correo ya está registrado')
      );
    }

    // Validar grupo sanguíneo
    if (!GeneralValidator.validateGrupoSanguineo(grupo_sanguineo)) {
      return res.status(400).json(
        CustomStatusMessage.from(null, 400, 'Grupo sanguíneo inválido')
      );
    }
  } catch (error) {
    return res.status(500).json(ErrorMessage.from('Error en la validación de datos'));
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

  const actualizarUsuario = (hash = null) => {
    const queryUsuario = hash
      ? `UPDATE usuario SET nombre = ?, apellido = ?, sexo = ?, fecha_nac = ?, telefono = ?, email = ?, password = ? WHERE id = ? AND tipo = 'paciente'`
      : `UPDATE usuario SET nombre = ?, apellido = ?, sexo = ?, fecha_nac = ?, telefono = ?, email = ? WHERE id = ? AND tipo = 'paciente'`;

    const paramsUsuario = hash
      ? [nombre, apellido, sexo, fecha_nac, telefono, email, hash, idUsuario]
      : [nombre, apellido, sexo, fecha_nac, telefono, email, idUsuario];

    db.run(queryUsuario, paramsUsuario, function (err) {
      if (err) {
        return res
          .status(500)
          .json(ErrorMessage.from('Error al actualizar datos del paciente'));
      }

      if (this.changes === 0) {
        return res
          .status(404)
          .json(CustomStatusMessage.from(null, 404, 'Paciente no encontrado o sin cambios'));
      }

      db.run(
        `UPDATE paciente_info SET grupo_sanguineo = ?, obra_social = ? WHERE usuario_id = ?`,
        [grupo_sanguineo, obra_social, idUsuario],
        function (err2) {
          if (err2) {
            return res
              .status(500)
              .json(ErrorMessage.from('Error al actualizar datos adicionales del paciente'));
          }

          res.status(200).json(
            ResponseMessage.from({ message: 'Perfil actualizado correctamente' })
          );
        }
      );
    });
  };

  if (password) {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json(ErrorMessage.from('Error al encriptar contraseña'));
      }
      actualizarUsuario(hash);
    });
  } else {
    actualizarUsuario();
  }
};



// Ver historia clínica del propio paciente
const verMiHistoriaClinica = (req, res) => {
  const idUsuario = req.user.id

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row)
      return res.status(500).json(ErrorMessage.from('Error al verificar tipo de usuario'))

    if (row.tipo !== 'paciente')
      return res.status(403).json(CustomStatusMessage.from(null, 403, 'No autorizado'))

    db.all(
      `SELECT 
         hc.id, 
         hc.fecha, 
         hc.nota, 
         hc.medicacion, 
         u.nombre AS medico_nombre,
         u.apellido AS medico_apellido,
         mi.consultorio,
         e.nombre AS especialidad
       FROM historia_clinica hc
       LEFT JOIN usuario u ON hc.medico_id = u.id
       LEFT JOIN medico_info mi ON u.id = mi.usuario_id
       LEFT JOIN especialidad e ON mi.especialidad_id = e.id
       WHERE hc.usuario_id = ?
       ORDER BY hc.fecha DESC`,
      [idUsuario],
      (err, rows) => {
        if (err)
          return res.status(500).json(ErrorMessage.from('Error al obtener historia clínica'))

        res.status(200).json(ResponseMessage.from(rows))
      }
    )
  })
}

// Obtener todos los médicos habilitados con su información profesional
const listarMedicosHabilitados = (req, res) => {
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
      e.id AS especialidad_id,
      e.nombre AS especialidad_nombre
    FROM usuario u
    LEFT JOIN medico_info mi ON u.id = mi.usuario_id
    LEFT JOIN especialidad e ON mi.especialidad_id = e.id
    WHERE u.tipo = 'medico' AND mi.habilitado = 1
    ORDER BY u.apellido, u.nombre
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json(ErrorMessage.from('Error al obtener la lista de médicos'));
    }

    res.status(200).json(ResponseMessage.from(rows));
  });
};


module.exports = {
  obtenerPerfilPaciente,
  actualizarPerfilPaciente,
  verMiHistoriaClinica,
  listarMedicosHabilitados
}
