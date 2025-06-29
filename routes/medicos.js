const express = require('express')
const router = express.Router()
const verificarToken = require('../middlewares/auth')
const controller = require('../controllers/medicosController')

router.use(verificarToken)

router.get('/mi-perfil', controller.obtenerPerfil)
router.put('/mi-perfil', controller.actualizarPerfil)
router.get('/buscar-paciente/:dni', controller.buscarPacientePorDNI) // query dni, arme un endpoint distinto porque este me trae la historia clinica
router.get('/all-pacientes', controller.allPacientes) // query params, dni, limit, offset
router.post('/cargar-consulta/:id', controller.cargarConsulta) // query id
router.get('/historia-clinica/:id', controller.verHistoriaClinica) // query id
router.get('/especialidades', controller.obtenerEspecialidades) 

module.exports = router