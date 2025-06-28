const express = require('express')
const router = express.Router()
const verificarToken = require('../middlewares/auth')
const controller = require('../controllers/adminController')

router.use(verificarToken)

router.delete('/eliminar-paciente/:id', controller.eliminarPaciente)
router.post('/register-medico', controller.cargarMedico)
router.put('/habilitacion-medico/:id', controller.cambiarHabilitacionMedico)
router.get('/all-medicos', controller.listarMedicos)

module.exports = router