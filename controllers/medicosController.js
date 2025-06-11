const db = require('../db/db')

// Obtener perfil del usuario (médico o paciente)
const obtenerPerfil = (req, res) => {
  const idUsuario = req.user.id

  db.get(`SELECT id, nombre, sexo, fecha_nac, telefono, tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error al obtener perfil' })
    res.json(row)
  })
}

// Actualizar perfil del usuario
const actualizarPerfil = (req, res) => {
  const idUsuario = req.user.id
  const { nombre, sexo, fecha_nac, telefono } = req.body

  db.run(`UPDATE usuario SET nombre = ?, sexo = ?, fecha_nac = ?, telefono = ? WHERE id = ?`,
    [nombre, sexo, fecha_nac, telefono, idUsuario],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error al actualizar datos' })
      if (this.changes === 0) return res.status(404).json({ error: 'Usuario no encontrado' })
      res.json({ message: 'Datos actualizados correctamente' })
    }
  )
}

// Buscar paciente por DNI (requiere ser médico o admin)
const buscarPacientePorDNI = (req, res) => {
  const idUsuario = req.user.id
  const { dni } = req.params

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Error al verificar permisos' })

    if (row.tipo !== 'medico' && row.tipo !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' })
    }

    db.get(`
      SELECT u.id, u.nombre, u.dni, u.sexo, u.fecha_nac, u.telefono, u.email, pi.grupo_sanguineo, pi.obra_social
      FROM usuario u
      LEFT JOIN paciente_info pi ON u.id = pi.usuario_id
      WHERE u.dni = ? AND u.tipo = 'paciente'
    `, [dni], (err, paciente) => {
      if (err) return res.status(500).json({ error: 'Error al buscar paciente' })
      if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' })
      res.json(paciente)
    })
  })
}


// Crear médico (solo admin)
const cargarMedico = (req, res) => {
  const idAdmin = req.user.id
  const { nombre, dni, sexo, fecha_nac, telefono, email, password, matricula, consultorio, especialidad_id } = req.body

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idAdmin], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Error al verificar permisos' })
    if (row.tipo !== 'admin') return res.status(403).json({ error: 'No autorizado' })

    db.run(`
      INSERT INTO usuario (nombre, dni, sexo, fecha_nac, telefono, tipo, email, password)
      VALUES (?, ?, ?, ?, ?, 'medico', ?, ?)
    `, [nombre, dni, sexo, fecha_nac, telefono, email, password], function (err) {
      if (err) return res.status(500).json({ error: 'Error al registrar médico' })
      const medicoId = this.lastID

      db.run(`
        INSERT INTO medico_info (usuario_id, matricula, consultorio, especialidad_id)
        VALUES (?, ?, ?, ?)
      `, [medicoId, matricula, consultorio, especialidad_id], function (err) {
        if (err) return res.status(500).json({ error: 'Error al guardar info adicional del médico' })
        res.status(201).json({ message: 'Médico creado correctamente', id: medicoId })
      })
    })
  })
}

// Eliminar paciente (solo admin)
const eliminarPaciente = (req, res) => {
  const idAdmin = req.user.id
  const idPaciente = req.params.id

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idAdmin], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Error al verificar permisos' })
    if (row.tipo !== 'admin') return res.status(403).json({ error: 'No autorizado' })

    db.run(`DELETE FROM usuario WHERE id = ? AND tipo = 'paciente'`, [idPaciente], function (err) {
      if (err) return res.status(500).json({ error: 'Error al eliminar paciente' })
      if (this.changes === 0) return res.status(404).json({ error: 'Paciente no encontrado' })
      res.json({ message: 'Paciente eliminado correctamente' })
    })
  })
}

// Ver historia clínica de un paciente (médico o el propio paciente)
const verHistoriaClinica = (req, res) => {
  const idUsuario = req.user.id
  const idPaciente = req.params.id

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Error al verificar permisos' })
    const tipo = row.tipo

    if (tipo !== 'medico' && idUsuario !== parseInt(idPaciente)) {
      return res.status(403).json({ error: 'No autorizado' })
    }

    db.all(`
      SELECT hc.id, hc.fecha, hc.nota, u.nombre AS medico
      FROM historia_clinica hc
      LEFT JOIN usuario u ON hc.medico_id = u.id
      WHERE hc.usuario_id = ?
      ORDER BY fecha DESC
    `, [idPaciente], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error al obtener historia clínica' })
      res.json(rows)
    })
  })
}

module.exports = {
  obtenerPerfil,
  actualizarPerfil,
  cargarMedico,
  buscarPacientePorDNI,
  eliminarPaciente,
  verHistoriaClinica
}
