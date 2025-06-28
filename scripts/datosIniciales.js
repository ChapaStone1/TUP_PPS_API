const db = require('../db/db');
const bcrypt = require('bcrypt');

// Especialidades médicas
const especialidades = [
  'Cardiología', 'Dermatología', 'Pediatría', 'Neurología', 'Oncología',
  'Ginecología', 'Clinica General', 'Psiquiatría', 'Endocrinología', 'Oftalmología',
  'Traumatología', 'Urología', 'Otorrinolaringología', 'Reumatología'
];

// 30 pacientes automáticos
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
}));

const admins = [
  {
    nombre: 'Juan Jose',
    apellido: 'Chaparro',
    dni: '37389808',
    sexo: 'M',
    fecha_nac: '1993-01-16',
    telefono: '2914705104',
    email: 'chapapr@gmail.com',
    password: 'admin123',
    tipo: 'admin',
  },
  {
    nombre: 'Sebastian',
    apellido: 'Gañan',
    dni: '22222222',
    sexo: 'M',
    fecha_nac: '1990-01-01',
    telefono: '291111111',
    email: 'sganan81@gmail.com',
    password: 'admin123',
    tipo: 'admin',
  },
];

async function cargarAdmins() {
  try {
    for (const admin of admins) {
      const hash = await bcrypt.hash(admin.password, 10);
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR IGNORE INTO usuario 
           (nombre, apellido, dni, sexo, fecha_nac, telefono, email, password, tipo)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            admin.nombre,
            admin.apellido,
            admin.dni,
            admin.sexo,
            admin.fecha_nac,
            admin.telefono,
            admin.email,
            hash,
            admin.tipo,
          ],
          (err) => (err ? reject(err) : resolve())
        );
      });
    }

    console.log('✅ Administradores cargados.');
  } catch (err) {
    console.error('❌ Error al cargar administradores:', err.message);
  }
}

const medicos = [
  {
    nombre: 'Sebastian', apellido: 'Martinez',
    dni: '34556243',
    sexo: 'M',
    fecha_nac: '1990-01-01',
    telefono: '29132577',
    email: 'sebmartinez@gmail.com',
    password: 'admin123',
    tipo: 'medico',
    matricula: 'MAT121222',
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
];

let medico1Id = null;

async function cargarMedicos() {
  try {
    for (let i = 0; i < medicos.length; i++) {
      const m = medicos[i];
      const hash = await bcrypt.hash(m.password, 10);

      await new Promise((resolve, reject) => {
        db.run(
          `INSERT OR IGNORE INTO usuario 
           (nombre, apellido, dni, sexo, fecha_nac, telefono, email, password, tipo)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            m.nombre,
            m.apellido,
            m.dni,
            m.sexo,
            m.fecha_nac,
            m.telefono,
            m.email,
            hash,
            m.tipo
          ],
          function (err) {
            if (err) return reject(err);

            const usuarioId = this.lastID;
            if (i === 0) medico1Id = usuarioId;

            db.run(
              `INSERT OR REPLACE INTO medico_info 
               (usuario_id, matricula, consultorio, especialidad_id, habilitado)
               VALUES (?, ?, ?, ?, ?)`,
              [
                usuarioId,
                m.matricula,
                m.consultorio,
                m.especialidadIndex + 1,
                1
              ],
              (err) => (err ? reject(err) : resolve())
            );
          }
        );
      });
    }

    console.log('✅ Médicos cargados.');
  } catch (err) {
    console.error('❌ Error al cargar médicos:', err.message);
  }
}

async function cargarDatos() {
  try {
    for (const nombre of especialidades) {
      await new Promise((resolve, reject) => {
        db.run(`INSERT OR IGNORE INTO especialidad (nombre) VALUES (?)`, [nombre], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    console.log('✅ Especialidades cargadas.');

    const pacientesIds = [];

    const pacientesManuales = [/* los 10 pacientes que ya escribiste, omito aquí por espacio */];

    for (const p of [...pacientesManuales, ...pacientes]) {
      const hash = await bcrypt.hash(p.password, 10);
      await new Promise((resolve, reject) => {
        db.run(`INSERT OR IGNORE INTO usuario 
                (nombre, apellido, dni, sexo, fecha_nac, telefono, email, password, tipo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.nombre, p.apellido, p.dni, p.sexo, p.fecha_nac, p.telefono, p.email, hash, p.tipo],
          function (err) {
            if (err) return reject(err);

            const pacienteId = this.lastID;
            pacientesIds.push(pacienteId);

            db.run(`INSERT INTO paciente_info (usuario_id, grupo_sanguineo, obra_social)
                    VALUES (?, ?, ?)`,
              [pacienteId, p.grupo_sanguineo, p.obra_social],
              (err) => (err ? reject(err) : resolve())
            );
          });
      });
    }

    if (!medico1Id) throw new Error('No se cargó el primer médico.');

    for (const pacienteId of pacientesIds) {
      for (let j = 0; j < 3; j++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - j * 7);
        const fechaStr = fecha.toISOString().split('T')[0];

        const notas = [
          'Paciente en buen estado general.',
          'Presenta leve dolor de cabeza.',
          'Control post tratamiento sin complicaciones.'
        ];
        const medicaciones = [
          'Paracetamol',
          'Ibuprofeno',
          'Amoxicilina'
        ];

        await new Promise((resolve, reject) => {
          db.run(`INSERT INTO historia_clinica 
                  (usuario_id, medico_id, fecha, medicacion, nota)
                  VALUES (?, ?, ?, ?, ?)`,
            [pacienteId, medico1Id, fechaStr, medicaciones[j], notas[j]],
            (err) => (err ? reject(err) : resolve())
          );
        });
      }
    }

    console.log('✅ Pacientes e historias clínicas cargados.');
  } catch (err) {
    console.error('❌ Error al cargar datos:', err.message);
  }
}

// Ejecutar todo en orden
async function main() {
  await cargarMedicos();
  await cargarDatos();
  await cargarAdmins();
}

main();
