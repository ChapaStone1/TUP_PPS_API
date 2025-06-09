const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

// Ruta de la base de datos
const dbPath = path.resolve(__dirname, 'clinica.db')

// Crear carpeta si no existe
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
}

// Conexión con SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message)
  } else {
    console.log('Conectado a la base de datos "clinica.db".')
  }
})

// Crear tablas
db.serialize(() => {
  // Tabla de médicos
  db.run(`CREATE TABLE IF NOT EXISTS medico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT,
    correo TEXT
  )`)

  // Tabla de especialidades
  db.run(`CREATE TABLE IF NOT EXISTS especialidad (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
  )`)

  // Relación muchos a muchos entre médico y especialidad
  db.run(`CREATE TABLE IF NOT EXISTS medico_especialidad (
    medico_id INTEGER,
    especialidad_id INTEGER,
    FOREIGN KEY (medico_id) REFERENCES medico(id),
    FOREIGN KEY (especialidad_id) REFERENCES especialidad(id),
    PRIMARY KEY (medico_id, especialidad_id)
  )`)

  // Tabla de pacientes
  db.run(`CREATE TABLE IF NOT EXISTS pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    sexo TEXT CHECK(sexo IN ('M', 'F')) NOT NULL,
    fecha_nac TEXT,
    telefono INTEGER,
    email TEXT UNIQUE,
    password TEXT,
    FOREIGN KEY (id_medico) REFERENCES medico(id)
    )`)

  // Tabla de visitas médicas
  db.run(`CREATE TABLE IF NOT EXISTS turno (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_paciente INTEGER,
    id_medico INTEGER,
    fecha_hora TEXT NOT NULL,
    motivo TEXT,
    FOREIGN KEY (id_paciente) REFERENCES paciente(id),
    FOREIGN KEY (id_medico) REFERENCES medico(id)
    )`)

})

module.exports = db
