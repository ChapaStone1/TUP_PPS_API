const express = require('express')
const router = express.Router()
const verificarToken = require('../middlewares/auth')
const controller = require('../controllers/adminController')

router.use(verificarToken)

router.delete('/eliminar-paciente/:id', controller.eliminarPaciente) //query id
router.post('/register-medico', controller.cargarMedico)
router.patch('/habilitacion-medico/:id', controller.cambiarHabilitacionMedico) //query id
router.get('/all-medicos', controller.listarMedicos)
router.get('/all-users', controller.allUsers) //query params, dni, limit, offset.
router.get('/reset-password/:id', controller.resetearPassword) //query id


module.exports = router