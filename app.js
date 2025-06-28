const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

// Middlewares
app.use(cors())
app.use(express.json())

const db = require('./db/db')

const authRoutes = require('./routes/auth')
const adminRoutes = require('./routes/admin')
const pacienteRoutes = require('./routes/pacientes')
const medicoRoutes = require('./routes/medicos')

// Usar rutas
app.use('/api/auth', authRoutes)          // POST /api/auth/login, /api/auth/register
app.use('/api/admin', adminRoutes) 
app.use('/api/pacientes', pacienteRoutes) // GET y PUT /api/pacientes/mi-perfil, GET /api/pacientes/mi-historia
app.use('/api/medicos', medicoRoutes)     // GET PUT /api/medicos/perfil, GET /api/medicos/buscar-paciente/:dni, POST /api/medicos/cargar, delete /api/medicos/eliminar-paciente/:id, GET /api/medicos/historia-clinica/:id

app.get('/', (req, res) => {
  res.send('Consultorios Médicos UTN API en funcionamiento')
})

const port = parseInt(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log("Server Open at " + port);
});