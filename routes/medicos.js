const express = require('express')
const router = express.Router()
const verificarToken = require('../middlewares/auth')
const controller = require('../controllers/medicosController')

router.use(verificarToken)

// Perfil del usuario (médico)
router.get('/mi-perfil', controller.obtenerPerfil)
router.put('/mi-perfil', controller.actualizarPerfil)

// Buscar paciente por DNI (solo médico)
router.get('/buscar-paciente/:dni', controller.buscarPacientePorDNI)
router.get('/all-pacientes', controller.allPacientes)
router.post('/cargar-consulta/:id', controller.cargarConsulta)
router.get('/historia-clinica/:id', controller.verHistoriaClinica)
router.get('/especialidades', controller.obtenerEspecialidades)

module.exports = router