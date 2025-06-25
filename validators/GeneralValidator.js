// GeneralValidator.js
const db = require('../db/db'); // adaptá el path si tu archivo se llama distinto

class GeneralValidator {
  static async isDniAvailable(dni) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT id FROM usuario WHERE dni = ?`, [dni], (err, row) => {
        if (err) return reject('Error al verificar DNI');
        resolve(!row); // Si no hay resultado, está disponible
      });
    });
  }

  static async isEmailAvailable(email) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT id FROM usuario WHERE email = ?`, [email], (err, row) => {
        if (err) return reject('Error al verificar email');
        resolve(!row);
      });
    });
  }
  static async isEmailAvailableForUpdate(email, excludeId) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT id FROM usuario WHERE email = ? AND id != ?`, [email, excludeId], (err, row) => {
        if (err) return reject('Error al verificar email');
        resolve(!row); // Está disponible si no hay otro usuario con ese email
        });
    });
  }

  static async isMatriculaAvailable(matricula) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM medico_info WHERE matricula = ?`,
        [matricula],
        (err, row) => {
          if (err) return reject('Error al verificar matrícula');
          resolve(!row);
        }
      );
    });
  }

  static async validateAll({ dni, email, matricula }) {
    const [dniOk, emailOk, matriculaOk] = await Promise.all([
      this.isDniAvailable(dni),
      this.isEmailAvailable(email),
      this.isMatriculaAvailable(matricula),
    ]);

    const errors = [];
    if (!dniOk) errors.push('El DNI ya está registrado');
    if (!emailOk) errors.push('El correo ya está registrado');
    if (!matriculaOk) errors.push('La matrícula ya está registrada');

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = GeneralValidator;
