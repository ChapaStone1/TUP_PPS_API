const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

// Ruta de la base de datos
const dbPath = path.resolve(__dirname, 'ConsultoriosUTN.db')

// Crear carpeta si no existe
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
}

// Conexión con SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message)
  } else {
    console.log('Conectado a la base de datos "ConsultoriosUTN.db".')
  }
})


db.serialize(() => {
  
  db.run(`CREATE TABLE IF NOT EXISTS usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    dni TEXT NOT NULL UNIQUE,
    sexo TEXT CHECK(sexo IN ('M', 'F')) NOT NULL,
    fecha_nac TEXT,
    telefono TEXT,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('paciente', 'medico', 'admin')) NOT NULL
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS especialidad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS medico_info (
    usuario_id INTEGER PRIMARY KEY,
    matricula INTEGER NOT NULL UNIQUE,
    consultorio TEXT NOT NULL,
    especialidad_id INTEGER,
    habilitado BOOLEAN NOT NULL DEFAULT 1,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (especialidad_id) REFERENCES especialidad(id)
)`)
  db.run(`CREATE TABLE IF NOT EXISTS paciente_info (
    usuario_id INTEGER PRIMARY KEY,
    grupo_sanguineo TEXT CHECK(grupo_sanguineo IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    obra_social TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS historia_clinica (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    medico_id INTEGER,
    fecha TEXT NOT NULL,
    medicacion TEXT NOT NULL,
    nota TEXT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (medico_id) REFERENCES usuario(id) ON DELETE SET NULL
  )`)
})

module.exports = db