const express = require('express')
const router = express.Router()
const controller = require('../controllers/medicosController')

// ver todos los médicos
router.get('/', controller.listarMedicos)

// buscar médicos por especialidad
router.get('/especialidad/:idEspecialidad', controller.buscarPorEspecialidad)

module.exports = router
