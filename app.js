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
const pacienteRoutes = require('./routes/pacientes')
const medicoRoutes = require('./routes/medicos')

// Usar rutas
app.use('/api/auth', authRoutes)          // /api/auth/login, /api/auth/register
app.use('/api/pacientes', pacienteRoutes) 
app.use('/api/medicos', medicoRoutes)     /

// Ruta base
app.get('/', (req, res) => {
  res.send('Consultorio Medico UTN API en funcionamiento')
})

const port = parseInt(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log("Server Open at " + port);
});