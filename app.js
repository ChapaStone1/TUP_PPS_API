const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

// Middlewares
app.use(cors())
app.use(express.json())

// Conexión a base de datos
const db = require('./db/db')

// Rutas
const authRoutes = require('./routes/auth')
const usuarioRoutes = require('./routes/usuarios')
const medicoRoutes = require('./routes/medicos')

// Usar rutas
app.use('/api/auth', authRoutes)          // /api/auth/login, /api/auth/register
app.use('/api/usuarios', usuarioRoutes) // Requiere token
app.use('/api/medicos', medicoRoutes)     // Público y (en algunos casos) con token admin

// Ruta base
app.get('/', (req, res) => {
  res.send('Turnero médico API en funcionamiento')
})

const port = parseInt(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log("Server Open at " + port);
});