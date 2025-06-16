const express = require('express')
const router = express.Router()
const verificarToken = require('../middlewares/auth')
const controller = require('../controllers/pacientesController')

router.use(verificarToken)

// GET /mi-perfil  -> Obtener perfil del paciente logueado
router.get('/mi-perfil', controller.obtenerPerfilPaciente)

// PUT /mi-perfil -> Actualizar perfil del paciente logueado
router.put('/mi-perfil', controller.actualizarPerfilPaciente)

// GET /mi-historia -> Ver historia clínica del paciente logueado
router.get('/mi-historia', controller.verMiHistoriaClinica)

module.exports = router