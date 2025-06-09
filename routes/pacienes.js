const express = require('express')
const router = express.Router()
const verificarToken = require('../middlewares/auth')
const controller = require('../controllers/pacientesController')

// 🔐 Todas las rutas requieren login
router.use(verificarToken)

router.get('/mi-perfil', controller.obtenerPerfil)
router.put('/mi-perfil', controller.actualizarPerfil)
router.get('/mis-turnos', controller.verTurnos)
router.post('/crear-turno', controller.crearTurno)
router.delete('/eliminar-turno/:idTurno', controller.eliminarTurno)

module.exports = router
