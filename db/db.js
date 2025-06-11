const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

// Ruta de la base de datos
const dbPath = path.resolve(__dirname, 'historiaClinicaConsultorios.db')

// Crear carpeta si no existe
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
}

// Conexión con SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message)
  } else {
    console.log('Conectado a la base de datos "historiaClinicaConsultorios.db".')
  }
})

// Crear tablas
db.serialize(() => {
  

  // Tabla de usuarios
  db.run(`CREATE TABLE IF NOT EXISTS usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    dni TEXT NOT NULL UNIQUE,
    sexo TEXT CHECK(sexo IN ('M', 'F')) NOT NULL,
    fecha_nac TEXT,
    telefono INTEGER,
    email TEXT UNIQUE,
    password TEXT,
    tipo TEXT CHECK(tipo IN ('paciente', 'medico')) NOT NULL
  )`)
  // Tabla de especialidades
  db.run(`CREATE TABLE IF NOT EXISTS especialidad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
  )`)
  // Información adicional de médicos
  db.run(`CREATE TABLE IF NOT EXISTS medico_info (
    usuario_id INTEGER PRIMARY KEY,
    matricula TEXT,
    consultorio TEXT,
    especialidad_id INTEGER,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    FOREIGN KEY (especialidad_id) REFERENCES especialidad(id)
  )`)
  // Información adicional de pacientes
  db.run(`CREATE TABLE IF NOT EXISTS paciente_info (
    usuario_id INTEGER PRIMARY KEY,
    grupo_sanguineo TEXT,
    obra_social TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
  )`)
  // Historia clínica
  db.run(`CREATE TABLE IF NOT EXISTS historia_clinica (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    medico_id INTEGER,
    fecha TEXT NOT NULL,
    medicacion TEXT NOT NULL,
    nota TEXT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id),
    FOREIGN KEY (medico_id) REFERENCES usuario(id)
  )`)
})

module.exports = db