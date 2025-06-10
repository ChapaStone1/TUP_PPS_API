const bcrypt = require('bcrypt')
const db = require('../db/db')
const jwt = require('jsonwebtoken')
const SECRET_KEY = process.env.SECRET_KEY // Guardá esto en .env real

// Registrar paciente
const register = (req, res) => {
  const { nombre, dni, sexo, fecha_nac, email, telefono, password } = req.body

  if (!nombre || !dni || !email || !password || !telefono || !sexo) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const tipo = 'paciente'

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: 'Error al encriptar contraseña' })

    db.run(`INSERT INTO usuario (nombre, dni, sexo, fecha_nac, telefono, tipo, email, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, dni, sexo, fecha_nac, telefono, tipo, email, hashedPassword],
      function (err) {
        if (err) return res.status(400).json({ error: 'Ese email o DNI ya existe o datos inválidos' })
        res.status(201).json({ message: 'Registro exitoso', usuarioId: this.lastID })
      }
    )
  })
}



// Login paciente
const login = (req, res) => {
  const { email, password } = req.body

  db.get(`SELECT * FROM usuario WHERE email = ?`, [email], (err, usuario) => {
    if (err || !usuario) return res.status(401).json({ error: 'Usuario no encontrado' })

    bcrypt.compare(password, usuario.password, (err, result) => {
      if (result) {
        const token = jwt.sign(
          { id: usuario.id, nombre: usuario.nombre },
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
