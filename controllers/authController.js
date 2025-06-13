const bcrypt = require('bcrypt')
const db = require('../db/db')
const jwt = require('jsonwebtoken')
const SECRET_KEY = process.env.SECRET_KEY // Guardá esto en .env real

// Registrar solo pacientes (con info adicional)
const register = (req, res) => {
  const {
    nombre,
    dni,
    sexo,
    fecha_nac,
    email,
    telefono,
    password,
    grupo_sanguineo,
    obra_social
  } = req.body

  // Validar campos obligatorios
  if (!nombre || !dni || !sexo || !fecha_nac || !email || !telefono || !password || !grupo_sanguineo || !obra_social) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' })
  }

  const tipo = 'paciente'

  // Hashear contraseña
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: 'Error al encriptar contraseña' })

    // Insertar en tabla usuario
    db.run(`
      INSERT INTO usuario (nombre, dni, sexo, fecha_nac, telefono, tipo, email, password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [nombre, dni, sexo, fecha_nac, telefono, tipo, email, hashedPassword],
      function (err) {
        if (err) {
          return res.status(400).json({ error: 'Ese email o DNI ya existe o datos inválidos' })
        }

        const pacienteId = this.lastID

        // Insertar en tabla paciente_info
        db.run(`
          INSERT INTO paciente_info (usuario_id, grupo_sanguineo, obra_social)
          VALUES (?, ?, ?)
        `,
          [pacienteId, grupo_sanguineo, obra_social],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Error al guardar información del paciente' })
            }

            res.status(201).json({ message: 'Paciente registrado exitosamente', usuarioId: pacienteId })
          })
      })
  })
}

// Login 
const login = (req, res) => {
  const { email, password } = req.body

  db.get(`SELECT * FROM usuario WHERE email = ?`, [email], (err, usuario) => {
    if (err || !usuario) return res.status(401).json({ error: 'Usuario no encontrado' })

    bcrypt.compare(password, usuario.password, (err, result) => {
      if (result) {
        const token = jwt.sign(
          {
            id: usuario.id,
            nombre: usuario.nombre,
            tipo: usuario.tipo // 👈 se agrega tipo al token
          },
          SECRET_KEY,
          { expiresIn: '2h' }
        )

        res.json({
          message: 'Login exitoso',
          token,
          tipo: usuario.tipo // 👈 se agrega tipo a la respuesta también
        })
      } else {
        res.status(401).json({ error: 'Contraseña incorrecta' })
      }
    })
  })
}


module.exports = { register, login }