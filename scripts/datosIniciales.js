const db = require('../db/db') // Ajustá la ruta si es necesario
const bcrypt = require('bcrypt')

const especialidades = [
  'Cardiología', 'Dermatología', 'Pediatría', 'Neurología', 'Oncología',
  'Ginecología', 'Clinica General', 'Psiquiatría', 'Endocrinología', 'Oftalmología'
]

const pacientes = Array.from({ length: 10 }, (_, i) => ({
  nombre: `Paciente${i + 1}`,
  dni: `4000000${i + 1}`,
  sexo: i % 2 === 0 ? 'M' : 'F',
  fecha_nac: `199${i}-01-01`,
  telefono: `113000000${i}`,
  email: `paciente${i + 1}@mail.com`,
  password: `clave${i + 1}`,
  tipo: 'paciente',
  grupo_sanguineo: 'O+',
  obra_social: 'OSDE'
}))

const medicos = [
  {
    nombre: 'Dr. Juan Chaparro',
    dni: '37389808',
    sexo: 'M',
    fecha_nac: '1993-01-16',
    telefono: '2914705104',
    email: 'chapapr@gmail.com',
    password: 'admin123',
    tipo: 'medico',
    matricula: 'MAT12345',
    consultorio: 'Consultorio 1',
    especialidadIndex: 0
  },
  {
    nombre: 'Dra. Laura Gómez',
    dni: '30000002',
    sexo: 'F',
    fecha_nac: '1985-09-21',
    telefono: '1123456790',
    email: 'lauragomez@medico.com',
    password: 'medico2',
    tipo: 'medico',
    matricula: 'MAT54321',
    consultorio: 'Consultorio 2',
    especialidadIndex: 1
  }
]

async function cargarDatos() {
  try {
    // Cargar especialidades
    especialidades.forEach(nombre => {
      db.run(`INSERT OR IGNORE INTO especialidad (nombre) VALUES (?)`, [nombre])
    })

    // Map para guardar IDs
    const pacientesIds = []
    let medico1Id = null

    // Cargar pacientes
    for (const p of pacientes) {
      const hash = await bcrypt.hash(p.password, 10)
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO usuario (nombre, dni, sexo, fecha_nac, telefono, email, password, tipo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.nombre, p.dni, p.sexo, p.fecha_nac, p.telefono, p.email, hash, p.tipo],
          function (err) {
            if (err) return reject(err)
            const pacienteId = this.lastID
            pacientesIds.push(pacienteId)
            db.run(`
              INSERT INTO paciente_info (usuario_id, grupo_sanguineo, obra_social)
              VALUES (?, ?, ?)`,
              [pacienteId, p.grupo_sanguineo, p.obra_social],
              (err) => (err ? reject(err) : resolve())
            )
          }
        )
      })
    }

    // Cargar médicos
    for (let i = 0; i < medicos.length; i++) {
      const m = medicos[i]
      const hash = await bcrypt.hash(m.password, 10)
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO usuario (nombre, dni, sexo, fecha_nac, telefono, email, password, tipo)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [m.nombre, m.dni, m.sexo, m.fecha_nac, m.telefono, m.email, hash, m.tipo],
          function (err) {
            if (err) return reject(err)
            const medicoId = this.lastID
            if (i === 0) medico1Id = medicoId // Guardar el ID del primer médico
            db.run(`
              INSERT INTO medico_info (usuario_id, matricula, consultorio, especialidad_id)
              VALUES (?, ?, ?, ?)`,
              [medicoId, m.matricula, m.consultorio, m.especialidadIndex + 1],
              (err) => (err ? reject(err) : resolve())
            )
          }
        )
      })
    }

    // Insertar 1 entrada en la historia clínica por paciente
    for (const pacienteId of pacientesIds) {
      const fecha = new Date().toISOString().split('T')[0] // Fecha actual en formato YYYY-MM-DD
      db.run(`
        INSERT INTO historia_clinica (usuario_id, medico_id, fecha, medicacion, nota)
        VALUES (?, ?, ?, ?, ?)`,
        [pacienteId, medico1Id, fecha, 'Paracetamol', 'Paciente en buen estado general.'],
        (err) => {
          if (err) console.error(`Error al cargar historia clínica para paciente ${pacienteId}:`, err.message)
        }
      )
    }

    console.log('✅ Datos cargados exitosamente (pacientes, médicos, especialidades e historias clínicas).')
  } catch (err) {
    console.error('❌ Error en la carga de datos:', err.message)
  }
}

cargarDatos()