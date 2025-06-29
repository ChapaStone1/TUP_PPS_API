const express = require('express')
const router = express.Router()
const verificarToken = require('../middlewares/auth')
const controller = require('../controllers/pacientesController')

router.use(verificarToken)

router.get('/mi-perfil', controller.obtenerPerfilPaciente)
router.put('/mi-perfil', controller.actualizarPerfilPaciente)
router.get('/historia-clinica', controller.verMiHistoriaClinica)
router.get('/medicos-habilitados', controller.listarMedicosHabilitados) // No requiere permisos

module.exports = router