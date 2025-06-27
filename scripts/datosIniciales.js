const db = require('../db/db') // Ajustá la ruta si es necesario
const bcrypt = require('bcrypt')

const especialidades = [
  'Cardiología', 'Dermatología', 'Pediatría', 'Neurología', 'Oncología',
  'Ginecología', 'Clinica General', 'Psiquiatría', 'Endocrinología', 'Oftalmología',
  'Traumatología', 'Urología', 'Otorrinolaringología', 'Reumatología'
]

// Generar 30 pacientes con nombres separados
const pacientes = [
  ['Sofía', 'Fernández'], ['Mateo', 'González'], ['Valentina', 'Rodríguez'], ['Juan', 'Pérez'],
  ['Isabella', 'López'], ['Santiago', 'Martínez'], ['Camila', 'García'], ['Matías', 'Sánchez'],
  ['Lucía', 'Romero'], ['Benjamín', 'Díaz'], ['Martina', 'Gómez'], ['Alejandro', 'Torres'],
  ['Emilia', 'Flores'], ['Tomás', 'Herrera'], ['Victoria', 'Ruiz'], ['Nicolás', 'Castillo'],
  ['Mía', 'Vargas'], ['Diego', 'Morales'], ['Julieta', 'Rojas'], ['Lucas', 'Medina'],
  ['Emma', 'Navarro'], ['Agustín', 'Mendoza'], ['Catalina', 'Santos'], ['Federico', 'Cruz'],
  ['María', 'Aguirre'], ['Bruno', 'Salazar'], ['Sara', 'Peña'], ['Andrés', 'Silva'],
  ['Paula', 'Castillo'], ['Gabriel', 'Ortiz']
].map(([nombre, apellido], i) => ({
  nombre,
  apellido,
  dni: `4000000${(i + 1).toString().padStart(2, '0')}`,
  sexo: i % 2 === 0 ? 'M' : 'F',
  fecha_nac: `199${i % 10}-01-01`,
  telefono: `11300000${i.toString().padStart(2, '0')}`,
  email: `${nombre.toLowerCase()}${apellido.toLowerCase()}${i + 1}@mail.com`,
  password: `clave${i + 1}`,
  tipo: 'paciente',
  grupo_sanguineo: ['O+', 'A+', 'B+', 'AB+'][i % 4],
  obra_social: ['OSDE', 'Swiss Medical', 'Galeno', 'Medifé'][i % 4]
}))

const medicos = [
  {
    nombre: 'Juan Jose', apellido: 'Chaparro',
    dni: '37389808',
    sexo: 'M',
    fecha_nac: '1993-01-16',
    telefono: '2914705104',
    email: 'chapapr@gmail.com',
    password: 'admin123',
    tipo: 'medico',
    matricula: 'MAT223311',
    consultorio: 'Consultorio 1',
    especialidadIndex: 0
  },
  {
    nombre: 'Sebastian', apellido: 'Gañan',
    dni: '22222222',
    sexo: 'M',
    fecha_nac: '1990-01-01',
    telefono: '291111111',
    email: 'sganan81@gmail.com',
    password: 'admin123',
    tipo: 'medico',
    matricula: 'MAT12312',
    consultorio: 'Consultorio 4',
    especialidadIndex: 4
  },
  {
    nombre: 'Laura', apellido: 'Gomez',
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
  },
  {
    nombre: 'Franco', apellido: 'Colapinto',
    dni: '42009322',
    sexo: 'M',
    fecha_nac: '2004-09-21',
    telefono: '1123456730',
    email: 'medico@example.com',
    password: 'admin123',
    tipo: 'medico',
    matricula: 'MAT32322',
    consultorio: 'Consultorio 3',
    especialidadIndex: 3
  }
]

async function cargarDatos() {


  
  try {
    // Cargar especialidades
    for (const nombre of especialidades) {
      await new Promise((resolve, reject) => {
        db.run(`INSERT OR IGNORE INTO especialidad (nombre) VALUES (?)`, [nombre], (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }

    const pacientesIds = []
    let medico1Id = null

    const pacientes2 = [
    {
      nombre: 'Ana',
      apellido: 'López',
      dni: '40000331',
      sexo: 'F',
      fecha_nac: '1995-04-10',
      telefono: '1130009991',
      email: 'paciente@example.com',
      password: 'admin123',
      tipo: 'paciente',
      grupo_sanguineo: 'A+',
      obra_social: 'OSDE'
    },
    {
      nombre: 'Pedro',
      apellido: 'Márquez',
      dni: '40000332',
      sexo: 'M',
      fecha_nac: '1992-08-15',
      telefono: '1130009992',
      email: 'pedromarquez@mail.com',
      password: 'claveManual2',
      tipo: 'paciente',
      grupo_sanguineo: 'B+',
      obra_social: 'Galeno'
    },
    {
      nombre: 'Luciano',
      apellido: 'Ramírez',
      dni: '40000333',
      sexo: 'M',
      fecha_nac: '1988-06-12',
      telefono: '1130009993',
      email: 'lucianoramirez@mail.com',
      password: 'claveManual3',
      tipo: 'paciente',
      grupo_sanguineo: 'O+',
      obra_social: 'Medifé'
    },
    {
      nombre: 'Carla',
      apellido: 'Muñoz',
      dni: '40000334',
      sexo: 'F',
      fecha_nac: '1990-11-23',
      telefono: '1130009994',
      email: 'carlamunoz@mail.com',
      password: 'claveManual4',
      tipo: 'paciente',
      grupo_sanguineo: 'AB+',
      obra_social: 'Swiss Medical'
    },
    {
      nombre: 'Esteban',
      apellido: 'Suárez',
      dni: '40000335',
      sexo: 'M',
      fecha_nac: '1985-03-30',
      telefono: '1130009995',
      email: 'estebansuarez@mail.com',
      password: 'claveManual5',
      tipo: 'paciente',
      grupo_sanguineo: 'A+',
      obra_social: 'OSDE'
    },
    {
      nombre: 'Marina',
      apellido: 'Paredes',
      dni: '40000336',
      sexo: 'F',
      fecha_nac: '1993-09-18',
      telefono: '1130009996',
      email: 'marinaparedes@mail.com',
      password: 'claveManual6',
      tipo: 'paciente',
      grupo_sanguineo: 'B+',
      obra_social: 'Galeno'
    },
    {
      nombre: 'Julián',
      apellido: 'Alonso',
      dni: '40000337',
      sexo: 'M',
      fecha_nac: '1991-07-25',
      telefono: '1130009997',
      email: 'julianalonso@mail.com',
      password: 'claveManual7',
      tipo: 'paciente',
      grupo_sanguineo: 'O+',
      obra_social: 'Medifé'
    },
    {
      nombre: 'Verónica',
      apellido: 'Maldonado',
      dni: '40000338',
      sexo: 'F',
      fecha_nac: '1989-12-02',
      telefono: '1130009998',
      email: 'veromaldonado@mail.com',
      password: 'claveManual8',
      tipo: 'paciente',
      grupo_sanguineo: 'AB+',
      obra_social: 'Swiss Medical'
    },
    {
      nombre: 'Facundo',
      apellido: 'Herrera',
      dni: '40000339',
      sexo: 'M',
      fecha_nac: '1994-05-08',
      telefono: '1130009999',
      email: 'facundoherrera@mail.com',
      password: 'claveManual9',
      tipo: 'paciente',
      grupo_sanguineo: 'A+',
      obra_social: 'OSDE'
      },
      {
      nombre: 'Paula',
      apellido: 'Ríos',
      dni: '40000340',
      sexo: 'F',
      fecha_nac: '1996-10-14',
      telefono: '1130010000',
      email: 'paularios@mail.com',
      password: 'claveManual10',
      tipo: 'paciente',
      grupo_sanguineo: 'B+',
      obra_social: 'Galeno'
      }
    ]
    
    for (const p of pacientes2) {
    const hash = await bcrypt.hash(p.password, 10)
    await new Promise((resolve, reject) => {
      db.run(`INSERT INTO usuario (nombre, apellido, dni, sexo, fecha_nac, telefono, email, password, tipo)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.nombre, p.apellido, p.dni, p.sexo, p.fecha_nac, p.telefono, p.email, hash, p.tipo],
        function (err) {
          if (err) return reject(err)
          const pacienteId = this.lastID
          pacientesIds.push(pacienteId)
          db.run(`INSERT INTO paciente_info (usuario_id, grupo_sanguineo, obra_social)
                  VALUES (?, ?, ?)`,
            [pacienteId, p.grupo_sanguineo, p.obra_social],
            (err) => (err ? reject(err) : resolve())
          )
        }
      )
    })
  }
    // Cargar pacientes
    for (const p of pacientes) {
      const hash = await bcrypt.hash(p.password, 10)
      await new Promise((resolve, reject) => {
        db.run(`INSERT INTO usuario (nombre, apellido, dni, sexo, fecha_nac, telefono, email, password, tipo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.nombre, p.apellido, p.dni, p.sexo, p.fecha_nac, p.telefono, p.email, hash, p.tipo],
          function (err) {
            if (err) return reject(err)
            const pacienteId = this.lastID
            pacientesIds.push(pacienteId)
            db.run(`INSERT INTO paciente_info (usuario_id, grupo_sanguineo, obra_social)
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
        db.run(`INSERT INTO usuario (nombre, apellido, dni, sexo, fecha_nac, telefono, email, password, tipo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [m.nombre, m.apellido, m.dni, m.sexo, m.fecha_nac, m.telefono, m.email, hash, m.tipo],
          function (err) {
            if (err) return reject(err)
            const medicoId = this.lastID
            if (i === 0) medico1Id = medicoId
            db.run(`INSERT INTO medico_info (usuario_id, matricula, consultorio, especialidad_id)
                    VALUES (?, ?, ?, ?)`,
              [medicoId, m.matricula, m.consultorio, m.especialidadIndex + 1],
              (err) => (err ? reject(err) : resolve())
            )
          }
        )
      })
    }

    // Insertar historia clínica (3 por paciente)
    for (const pacienteId of pacientesIds) {
      for (let j = 0; j < 3; j++) {
        const fecha = new Date()
        fecha.setDate(fecha.getDate() - (j * 7))
        const fechaStr = fecha.toISOString().split('T')[0]

        const notas = [
          'Paciente en buen estado general.',
          'Presenta leve dolor de cabeza.',
          'Control post tratamiento sin complicaciones.'
        ]

        const medicaciones = [
          'Paracetamol',
          'Ibuprofeno',
          'Amoxicilina'
        ]

        await new Promise((resolve, reject) => {
          db.run(`INSERT INTO historia_clinica (usuario_id, medico_id, fecha, medicacion, nota)
                  VALUES (?, ?, ?, ?, ?)`,
            [pacienteId, medico1Id, fechaStr, medicaciones[j], notas[j]],
            (err) => {
              if (err) {
                console.error(`Error al cargar historia clínica para paciente ${pacienteId}:`, err.message)
                reject(err)
              } else {
                resolve()
              }
            }
          )
        })
      }
    }

    console.log('✅ Datos cargados exitosamente (30 pacientes, médicos, especialidades e historias clínicas).')
  } catch (err) {
    console.error('❌ Error en la carga de datos:', err.message)
  }
}

cargarDatos()
