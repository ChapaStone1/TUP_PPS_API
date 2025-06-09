const bcrypt = require('bcrypt')
const db = require('../db/db')
const jwt = require('jsonwebtoken')
const SECRET_KEY = process.env.SECRET_KEY // Guardá esto en .env real

// Registrar paciente
const register = (req, res) => {
  const { nombre, sexo, fecha_nac, email, telefono, password } = req.body

  if (!nombre || !email || !password || !telefono) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: 'Error al encriptar contraseña' })

    db.run(`INSERT INTO paciente (nombre, sexo, fecha_nac, email, telefono, password)
            VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, sexo, fecha_nac, email, telefono, hashedPassword],
      function (err) {
        if (err) return res.status(400).json({ error: 'Ese email ya existe o datos inválidos' })
        res.status(201).json({ message: 'Registro exitoso', pacienteId: this.lastID })
      }
    )
  })
}

// Login paciente
const login = (req, res) => {
  const { email, password } = req.body

  db.get(`SELECT * FROM paciente WHERE email = ?`, [email], (err, paciente) => {
    if (err || !paciente) return res.status(401).json({ error: 'Usuario no encontrado' })

    bcrypt.compare(password, paciente.password, (err, result) => {
      if (result) {
        const token = jwt.sign(
          { id: paciente.id, nombre: paciente.nombre },
          SECRET_KEY,
          { expiresIn: '2h' }
        )
        res.json({ message: 'Login exitoso', token })
      } else {
        res.status(401).json({ error: 'Contraseña incorrecta' })
      }
    })
  })
}

module.exports = { register, login }
