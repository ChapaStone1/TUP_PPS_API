const db = require('../db/db')

// Obtener perfil del paciente (solo si es paciente)
const obtenerPerfilPaciente = (req, res) => {
  const idUsuario = req.user.id

  db.get(`SELECT id, nombre, sexo, fecha_nac, telefono, email FROM usuario WHERE id = ? AND tipo = 'paciente'`,
    [idUsuario],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Error al obtener perfil' })
      if (!row) return res.status(404).json({ error: 'Paciente no encontrado' })
      res.json(row)
    }
  )
}

// Actualizar perfil del paciente (solo el mismo paciente)
const actualizarPerfilPaciente = (req, res) => {
  const idUsuario = req.user.id
  const { nombre, sexo, fecha_nac, telefono } = req.body

  db.run(
    `UPDATE usuario SET nombre = ?, sexo = ?, fecha_nac = ?, telefono = ? WHERE id = ? AND tipo = 'paciente'`,
    [nombre, sexo, fecha_nac, telefono, idUsuario],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error al actualizar perfil' })
      if (this.changes === 0) return res.status(404).json({ error: 'Paciente no encontrado o sin cambios' })
      res.json({ message: 'Perfil actualizado correctamente' })
    }
  )
}

// Ver historia clínica del propio paciente
const verMiHistoriaClinica = (req, res) => {
  const idUsuario = req.user.id

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Error al verificar tipo de usuario' })
    if (row.tipo !== 'paciente') return res.status(403).json({ error: 'No autorizado' })

    db.all(
      `SELECT hc.id, hc.fecha, hc.nota, u.nombre AS medico
       FROM historia_clinica hc
       LEFT JOIN usuario u ON hc.medico_id = u.id
       WHERE hc.usuario_id = ?
       ORDER BY hc.fecha DESC`,
      [idUsuario],
      (err, rows) => {
        if (err) return res.status(500).json({ error: 'Error al obtener historia clínica' })
        res.json(rows)
      }
    )
  })
}

module.exports = {
  obtenerPerfilPaciente,
  actualizarPerfilPaciente,
  verMiHistoriaClinica
}
