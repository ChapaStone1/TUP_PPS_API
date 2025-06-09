const jwt = require('jsonwebtoken')
const SECRET_KEY = process.env.SECRET_KEY

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Token requerido' })

  const token = authHeader.split(' ')[1]
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token inválido' })
    req.user = decoded // queda disponible en la request
    next()
  })
}

module.exports = verificarToken