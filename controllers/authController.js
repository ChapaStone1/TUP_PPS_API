const bcrypt = require('bcrypt')
const db = require('../db/db')
const jwt = require('jsonwebtoken')
const SECRET_KEY = process.env.SECRET_KEY

const ResponseMessage = require('../models/ResponseMessage')
const ErrorMessage = require('../models/ErrorMessage')
const CustomStatusMessage = require('../models/CustomStatusMessage')

// Registrar solo pacientes
const register = (req, res) => {
  const {
    nombre,
    apellido,
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
  if (
    !nombre || !apellido || !dni || !sexo || !fecha_nac ||
    !email || !telefono || !password || !grupo_sanguineo || !obra_social
  ) {
    return res.status(400).json(
      CustomStatusMessage.from(null, 400, 'Faltan campos obligatorios')
    )
  }

  const tipo = 'paciente'

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json(ErrorMessage.from('Error al encriptar contraseña'))

    db.run(
      `
      INSERT INTO usuario (nombre, apellido, dni, sexo, fecha_nac, telefono, email, password, tipo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [nombre, apellido, dni, sexo, fecha_nac, telefono, email, hashedPassword, tipo],
      function (err) {
        if (err) {
          return res.status(400).json(
            CustomStatusMessage.from(null, 400, 'Email o DNI ya existe o datos inválidos')
          )
        }

        const pacienteId = this.lastID

        db.run(
          `
          INSERT INTO paciente_info (usuario_id, grupo_sanguineo, obra_social)
          VALUES (?, ?, ?)
        `,
          [pacienteId, grupo_sanguineo, obra_social],
          (err) => {
            if (err) {
              return res.status(500).json(ErrorMessage.from('Error al guardar información del paciente'))
            }

            res.status(201).json(
              ResponseMessage.from({
                message: 'Paciente registrado exitosamente',
                usuarioId: pacienteId
              }, 201)
            )
          }
        )
      }
    )
  })
}

// Login
const login = (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json(CustomStatusMessage.from(null, 400, 'Email y contraseña son obligatorios'))
  }

  db.get(`SELECT * FROM usuario WHERE email = ?`, [email], (err, usuario) => {
    if (err) return res.status(500).json(ErrorMessage.from('Error al buscar usuario'))
    if (!usuario) return res.status(401).json(CustomStatusMessage.from(null, 401, 'Usuario no encontrado'))

    bcrypt.compare(password, usuario.password, (err, result) => {
      if (err) return res.status(500).json(ErrorMessage.from('Error al verificar contraseña'))

      if (result) {
        const token = jwt.sign(
          {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            tipo: usuario.tipo
          },
          SECRET_KEY,
          { expiresIn: '2h' }
        )

        res.status(200).json(ResponseMessage.from({
          message: 'Login exitoso',
          token,
          tipo: usuario.tipo
        }))
      } else {
        res.status(401).json(CustomStatusMessage.from(null, 401, 'Contraseña incorrecta'))
      }
    })
  })
}

module.exports = { register, login }
