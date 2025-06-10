const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcrypt') // para encriptar la contraseña

const db = new sqlite3.Database('./db/clinica.db')

// Datos del admin
const nombre = 'Juan Chaparro'
const dni = '37389808'
const sexo = 'M'
const fecha_nac = '1993-01-16'
const telefono = '2914705104'
const tipo = 'admin'
const email = 'chapapr@gmail.com'
const password = 'admin123' // simple para prueba

// Hasheamos la contraseña
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error al hashear contraseña:', err)
    return
  }

  db.run(`
    INSERT INTO usuario (nombre, dni, sexo, fecha_nac, telefono, tipo, email, password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [nombre, dni, sexo, fecha_nac, telefono, tipo, email, hash], function (err) {
    if (err) {
      console.error('Error al insertar usuario admin:', err.message)
    } else {
      console.log('✅ Usuario admin creado con ID:', this.lastID)
    }
    db.close()
  })
})
