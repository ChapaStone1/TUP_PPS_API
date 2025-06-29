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
app.use('/api/auth', authRoutes)        
app.use('/api/admin', adminRoutes) 
app.use('/api/pacientes', pacienteRoutes) 
app.use('/api/medicos', medicoRoutes)     

app.get('/', (req, res) => {
  res.send('Consultorios Médicos UTN API en funcionamiento')
})

const port = parseInt(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log("Server Open at " + port);
});