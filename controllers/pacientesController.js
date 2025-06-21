const db = require('../db/db')
const ResponseMessage = require('../models/ResponseMessage')
const ErrorMessage = require('../models/ErrorMessage')
const CustomStatusMessage = require('../models/CustomStatusMessage')

// Obtener perfil del paciente (solo si es paciente)
const obtenerPerfilPaciente = (req, res) => {
  const idUsuario = req.user.id

  const query = `
    SELECT 
      u.id, u.nombre, u.dni, u.sexo, u.fecha_nac, u.telefono, u.email,
      pi.grupo_sanguineo, pi.obra_social
    FROM usuario u
    LEFT JOIN paciente_info pi ON u.id = pi.usuario_id
    WHERE u.id = ? AND u.tipo = 'paciente'
  `

  db.get(query, [idUsuario], (err, row) => {
    if (err)
      return res
        .status(500)
        .json(ErrorMessage.from('Error al obtener perfil'))

    if (!row)
      return res
        .status(404)
        .json(CustomStatusMessage.from(null, 404, 'Paciente no encontrado'))

    res.status(200).json(ResponseMessage.from(row))
  })
}


// Actualizar perfil del paciente (solo el mismo paciente)
const actualizarPerfilPaciente = (req, res) => {
  const idUsuario = req.user.id
  const { nombre, sexo, fecha_nac, telefono, email, grupo_sanguineo, obra_social } = req.body

  db.run(
    `UPDATE usuario SET nombre = ?, sexo = ?, fecha_nac = ?, telefono = ?, email = ? WHERE id = ? AND tipo = 'paciente'`,
    [nombre, sexo, fecha_nac, telefono, email, idUsuario],
    function (err) {
      if (err)
        return res
          .status(500)
          .json(ErrorMessage.from('Error al actualizar datos del paciente'))

      if (this.changes === 0)
        return res
          .status(404)
          .json(CustomStatusMessage.from(null, 404, 'Paciente no encontrado o sin cambios en usuario'))

      // Actualizar datos adicionales
      db.run(
        `UPDATE paciente_info SET grupo_sanguineo = ?, obra_social = ? WHERE usuario_id = ?`,
        [grupo_sanguineo, obra_social, idUsuario],
        function (err2) {
          if (err2)
            return res
              .status(500)
              .json(ErrorMessage.from('Error al actualizar datos adicionales del paciente'))

          res.status(200).json(ResponseMessage.from({ message: 'Perfil actualizado correctamente' }))
        }
      )
    }
  )
}


// Ver historia clínica del propio paciente
const verMiHistoriaClinica = (req, res) => {
  const idUsuario = req.user.id

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row)
      return res
        .status(500)
        .json(ErrorMessage.from('Error al verificar tipo de usuario'))

    if (row.tipo !== 'paciente')
      return res
        .status(403)
        .json(CustomStatusMessage.from(null, 403, 'No autorizado'))

    db.all(
      `SELECT 
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
       ORDER BY hc.fecha DESC`,
      [idUsuario],
      (err, rows) => {
        if (err)
          return res
            .status(500)
            .json(ErrorMessage.from('Error al obtener historia clínica'))

        res.status(200).json(ResponseMessage.from(rows))
      }
    )
  })
}


module.exports = {
  obtenerPerfilPaciente,
  actualizarPerfilPaciente,
  verMiHistoriaClinica
}