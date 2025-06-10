const express = require('express')
const router = express.Router()
const verificarToken = require('../middlewares/auth')
const controller = require('../controllers/usuariosController')

// 🔐 Todas las rutas requieren login
router.use(verificarToken)

// Perfil
router.get('/mi-perfil', controller.obtenerPerfil)
router.put('/mi-perfil', controller.actualizarPerfil)

// Turnos (solo para tipo paciente)
router.get('/mis-turnos', controller.verTurnos)
router.post('/crear-turno', controller.crearTurno)
router.delete('/eliminar-turno/:idTurno', controller.eliminarTurno)

// Opciones según tipo de usuario
router.get('/opciones', controller.opciones)

// Funciones para tipo admin
router.post('/medico', controller.cargarMedico)
router.delete('/medico/:id', controller.eliminarMedico)

module.exports = router
