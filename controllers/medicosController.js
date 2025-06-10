const db = require('../db/db')

// Obtener lista de médicos con sus especialidades
const listarMedicos = (req, res) => {
  db.all(`
    SELECT m.id, m.nombre, m.email, m.telefono, m.imagen,
           GROUP_CONCAT(e.nombre, ', ') AS especialidades
    FROM medico m
    LEFT JOIN medico_especialidad me ON me.medico_id = m.id
    LEFT JOIN especialidad e ON e.id = me.especialidad_id
    GROUP BY m.id
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al obtener médicos' })
    res.json(rows)
  })
}

// Buscar médicos por ID de especialidad
const buscarPorEspecialidad = (req, res) => {
  const { idEspecialidad } = req.params

  db.all(`
    SELECT m.id, m.nombre, m.email, m.telefono, m.imagen
    FROM medico m
    JOIN medico_especialidad me ON me.medico_id = m.id
    WHERE me.especialidad_id = ?
  `, [idEspecialidad], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al buscar médicos por especialidad' })
    res.json(rows)
  })
}

module.exports = {
  listarMedicos,
  buscarPorEspecialidad
}
