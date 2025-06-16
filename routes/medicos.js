const express = require('express')
const router = express.Router()
const verificarToken = require('../middlewares/auth')
const controller = require('../controllers/medicosController')

router.use(verificarToken)

// Perfil del usuario (médico)
router.get('/perfil', controller.obtenerPerfil)
router.put('/perfil', controller.actualizarPerfil)

// Buscar paciente por DNI (solo médico)
router.get('/buscar-paciente/:dni', controller.buscarPacientePorDNI)

// Todos los pacientes (solo médico)
router.get('/all', controller.allPacientes)

// Crear médico (solo admin)
router.post('/cargar-medico', controller.cargarMedico)
router.post('/cargar-consulta/:id', controller.cargarConsulta)
router.delete('/eliminar-pacientes/:id', controller.eliminarPaciente)

router.get('/historia-clinica/:id', controller.verHistoriaClinica)

module.exports = router