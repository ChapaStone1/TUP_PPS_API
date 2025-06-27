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

  static async isDniAvailableForUpdate(dni, idUsuario) {
    if (!idUsuario) {
      throw new Error('Falta el ID del usuario para validar la actualización');
    }
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM usuario WHERE dni = ? AND id != ?`,
        [dni, idUsuario],
        (err, row) => {
          if (err) return reject('Error al verificar DNI');
          resolve(!row); // Disponible si no hay otro usuario con ese dni
        }
      );
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

  static async isEmailAvailableForUpdate(email, idUsuario) {
    if (!idUsuario) {
      throw new Error('Falta el ID del usuario para validar la actualización');
    }
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM usuario WHERE email = ? AND id != ?`,
        [email, idUsuario],
        (err, row) => {
          if (err) return reject('Error al verificar email');
          resolve(!row); // Está disponible si no hay otro usuario con ese email
        }
      );
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

  static async isMatriculaAvailableForUpdate(matricula, idUsuario) {
    if (!idUsuario) {
      throw new Error('Falta el ID del usuario para validar la actualización');
    }
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM medico_info WHERE matricula = ? AND usuario_id != ?`,
        [matricula, idUsuario],
        (err, row) => {
          if (err) return reject('Error al verificar matrícula');
          resolve(!row);
        }
      );
    });
  }
  static async validateGrupoSanguineo(grupo) {
    const tiposValidos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    return tiposValidos.includes(grupo);
  }

  static validarEmailFormato(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

static validarPasswordSegura(password) {
  return typeof password === 'string' && password.length >= 6;
}

  static async validateRegister({ dni, email, matricula }) {
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

  static async validateUpdate({ dni, email, idUsuario }) {
    const [dniOk, emailOk, matriculaOk] = await Promise.all([
      this.isDniAvailableForUpdate(dni, idUsuario),
      this.isEmailAvailableForUpdate(email, idUsuario),
    ]);

    const errors = [];
    if (!dniOk) errors.push('El DNI ya está registrado por otro usuario');
    if (!emailOk) errors.push('El correo ya está registrado por otro usuario');
    if (!matriculaOk) errors.push('La matrícula ya está registrada por otro usuario');

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = GeneralValidator;

