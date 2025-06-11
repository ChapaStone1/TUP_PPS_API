const express = require('express')
const router = express.Router()
const verificarToken = require('../middlewares/auth')
const controller = require('../controllers/medicosController')

// 🔐 Todas las rutas requieren login
router.use(verificarToken)

// Perfil del usuario (paciente o médico)
router.get('/perfil', controller.obtenerPerfil)
router.put('/perfil', controller.actualizarPerfil)

// Buscar paciente por DNI (solo médicos o admin)
router.get('/buscar-paciente/:dni', controller.buscarPacientePorDNI)

// Crear médico (solo admin)
router.post('/cargarMedico', controller.cargarMedico)

// Crear consulta
router.post('/cargarConsulta/:id', controller.cargarConsulta)

// Eliminar paciente (solo admin)
router.delete('/eliminar-pacientes/:id', controller.eliminarPaciente)

// Ver historia clínica (paciente o médico autorizado)
router.get('/historia-clinica/:id', controller.verHistoriaClinica)

module.exports = router