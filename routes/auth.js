const express = require('express')
const router = express.Router()
const { register, login } = require('../controllers/authController')

router.post('/register-paciente', register)
router.post('/login', login)

module.exports = router
