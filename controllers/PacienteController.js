const db = require('../db')

// Obtener perfil del paciente
const obtenerPerfil = (req, res) => {
  const idPaciente = req.user.id

  db.get(`SELECT id, nombre, sexo, fecha_nac, telefono FROM paciente WHERE id = ?`, [idPaciente], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error al obtener perfil' })
    res.json(row)
  })
}

// Actualizar perfil del paciente
const actualizarPerfil = (req, res) => {
  const idPaciente = req.user.id
  const { nombre, sexo, fecha_nac, telefono } = req.body

  db.run(`UPDATE paciente SET nombre = ?, sexo = ?, fecha_nac = ?, telefono = ? WHERE id = ?`,
    [nombre, sexo, fecha_nac, telefono, idPaciente],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error al actualizar datos' })
      if (this.changes === 0) return res.status(404).json({ error: 'Paciente no encontrado' })
      res.json({ message: 'Datos actualizados correctamente' })
    }
  )
}

// Ver turnos del paciente
const verTurnos = (req, res) => {
  const idPaciente = req.user.id

  db.all(`SELECT * FROM turno WHERE id_paciente = ? ORDER BY fecha DESC`, [idPaciente], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error en la base de datos' })
    res.json(rows)
  })
}

// Crear nuevo turno solo si no hay otro vigente con el mismo médico
const crearTurno = (req, res) => {
  const idPaciente = req.user.id
  const { id_medico, fecha, motivo } = req.body

  if (!id_medico || !fecha || !motivo) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const ahora = new Date().toISOString()

  // Verificar si ya hay un turno futuro con ese médico
  db.get(`
    SELECT id FROM turno
    WHERE id_paciente = ? AND id_medico = ? AND fecha >= ?
  `, [idPaciente, id_medico, ahora], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error al verificar turno existente' })

    if (row) {
      return res.status(409).json({ error: 'Ya tenés un turno vigente con este médico' })
    }

    // Insertar el nuevo turno
    db.run(`
      INSERT INTO turno (id_paciente, id_medico, fecha, motivo)
      VALUES (?, ?, ?, ?)
    `, [idPaciente, id_medico, fecha, motivo],
      function (err) {
        if (err) return res.status(500).json({ error: 'Error al crear turno' })
        res.status(201).json({ message: 'Turno creado', turnoId: this.lastID })
      }
    )
  })
}

// Eliminar solo turnos posteriores a la fecha actual
const eliminarTurno = (req, res) => {
  const idPaciente = req.user.id
  const idTurno = req.params.idTurno
  const ahora = new Date().toISOString()

  db.run(`
    DELETE FROM turno
    WHERE id = ? AND id_paciente = ? AND fecha > ?
  `, [idTurno, idPaciente, ahora],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error al eliminar turno' })
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Turno no encontrado, no autorizado o ya vencido' })
      }
      res.json({ message: 'Turno eliminado correctamente' })
    }
  )
}

module.exports = {
  obtenerPerfil,
  actualizarPerfil,
  verTurnos,
  crearTurno,
  eliminarTurno
}
