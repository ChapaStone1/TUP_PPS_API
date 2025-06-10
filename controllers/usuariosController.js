const db = require('../db/db')

// Obtener perfil del usuario
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

// Ver turnos del usuario (solo paciente)
const verTurnos = (req, res) => {
  const idUsuario = req.user.id

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Error al verificar tipo de usuario' })
    if (row.tipo !== 'paciente') return res.status(403).json({ error: 'No autorizado' })

    db.all(`SELECT * FROM turno WHERE id_paciente = ? ORDER BY fecha DESC`, [idUsuario], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error en la base de datos' })
      res.json(rows)
    })
  })
}

// Crear nuevo turno (solo paciente)
const crearTurno = (req, res) => {
  const idUsuario = req.user.id
  const { id_medico, fecha, motivo } = req.body

  if (!id_medico || !fecha || !motivo) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Error al verificar tipo de usuario' })
    if (row.tipo !== 'paciente') return res.status(403).json({ error: 'No autorizado' })

    const ahora = new Date().toISOString()

    db.get(`
      SELECT id FROM turno
      WHERE id_paciente = ? AND id_medico = ? AND fecha >= ?
    `, [idUsuario, id_medico, ahora], (err, row) => {
      if (err) return res.status(500).json({ error: 'Error al verificar turno existente' })

      if (row) {
        return res.status(409).json({ error: 'Ya tenés un turno vigente con este médico' })
      }

      db.run(`
        INSERT INTO turno (id_paciente, id_medico, fecha, motivo)
        VALUES (?, ?, ?, ?)
      `, [idUsuario, id_medico, fecha, motivo],
        function (err) {
          if (err) return res.status(500).json({ error: 'Error al crear turno' })
          res.status(201).json({ message: 'Turno creado', turnoId: this.lastID })
        }
      )
    })
  })
}

// Eliminar turno futuro (solo paciente)
const eliminarTurno = (req, res) => {
  const idUsuario = req.user.id
  const idTurno = req.params.idTurno
  const ahora = new Date().toISOString()

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Error al verificar tipo de usuario' })
    if (row.tipo !== 'paciente') return res.status(403).json({ error: 'No autorizado' })

    db.run(`
      DELETE FROM turno
      WHERE id = ? AND id_paciente = ? AND fecha > ?
    `, [idTurno, idUsuario, ahora],
      function (err) {
        if (err) return res.status(500).json({ error: 'Error al eliminar turno' })
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Turno no encontrado, no autorizado o ya vencido' })
        }
        res.json({ message: 'Turno eliminado correctamente' })
      }
    )
  })
}

// Ver opciones según el tipo de usuario
const opciones = (req, res) => {
  const idUsuario = req.user.id

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error al obtener tipo de usuario' })

    if (!row) return res.status(404).json({ error: 'Usuario no encontrado' })

    const tipo = row.tipo

    if (tipo === 'paciente') {
      return res.json({ opciones: ['verTurnos', 'crearTurno', 'eliminarTurno'] })
    } else if (tipo === 'admin') {
      return res.json({ opciones: ['cargarMedico', 'eliminarMedico'] })
    } else {
      return res.status(403).json({ error: 'Tipo de usuario no autorizado' })
    }
  })
}

// Funciones para admins
const cargarMedico = (req, res) => {
  const idUsuario = req.user.id
  const { nombre, telefono, correo } = req.body

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Error al verificar usuario' })
    if (row.tipo !== 'admin') return res.status(403).json({ error: 'No autorizado' })

    db.run(`INSERT INTO medico (nombre, telefono, correo) VALUES (?, ?, ?)`,
      [nombre, telefono, correo],
      function (err) {
        if (err) return res.status(500).json({ error: 'Error al cargar médico' })
        res.status(201).json({ message: 'Médico cargado', id: this.lastID })
      })
  })
}

const eliminarMedico = (req, res) => {
  const idUsuario = req.user.id
  const idMedico = req.params.id

  db.get(`SELECT tipo FROM usuario WHERE id = ?`, [idUsuario], (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'Error al verificar usuario' })
    if (row.tipo !== 'admin') return res.status(403).json({ error: 'No autorizado' })

    db.run(`DELETE FROM medico WHERE id = ?`, [idMedico], function (err) {
      if (err) return res.status(500).json({ error: 'Error al eliminar médico' })
      if (this.changes === 0) return res.status(404).json({ error: 'Médico no encontrado' })
      res.json({ message: 'Médico eliminado correctamente' })
    })
  })
}

module.exports = {
  obtenerPerfil,
  actualizarPerfil,
  verTurnos,
  crearTurno,
  eliminarTurno,
  opciones,
  cargarMedico,
  eliminarMedico
}

