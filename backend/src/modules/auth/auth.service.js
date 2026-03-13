const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const notificationsService = require('../notifications/notifications.service');

// Mapa en memoria para rastrear intentos fallidos (en producción usar Redis)
const failedLoginAttempts = new Map();

class AuthService {
  async login(email, password) {
    const query = 'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL';
    const { rows } = await db.query(query, [email]);

    if (rows.length === 0) {
      throw { status: 401, message: 'Credenciales inválidas' };
    }

    const user = rows[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatch) {
      const attempts = (failedLoginAttempts.get(email) || 0) + 1;
      failedLoginAttempts.set(email, attempts);

      if (attempts >= 3) {
        // Disparar alerta de seguridad
        notificationsService.createNotification({
          type: 'SECURITY_ALERT',
          title: 'Alerta de Seguridad',
          message: `Múltiples intentos fallidos (${attempts}) de inicio de sesión para la cuenta: ${email}.`,
          related_id: user.id
        }).catch(console.error);
        
        // Reiniciar contador después de notificar para no saturar, o se podría bloquear la cuenta
        failedLoginAttempts.set(email, 0);
      }

      throw { status: 401, message: 'Credenciales inválidas' };
    }

    // Inicio de sesión exitoso, reiniciar intentos
    failedLoginAttempts.delete(email);

    const payload = {
      user_id: user.id,
      role: user.role,
      branch_id: user.branch_id
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch_id: user.branch_id
      },
      accessToken,
      refreshToken
    };
  }

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const payload = {
        user_id: decoded.user_id,
        role: decoded.role,
        branch_id: decoded.branch_id
      };

      const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
      return { accessToken };
    } catch (err) {
      throw { status: 401, message: 'Refresh token inválido o expirado' };
    }
  }

  async getMe(userId) {
    const query = 'SELECT id, name, email, role, branch_id FROM users WHERE id = $1';
    const { rows } = await db.query(query, [userId]);
    if (rows.length === 0) throw { status: 404, message: 'Usuario no encontrado' };
    return rows[0];
  }
}

module.exports = new AuthService();
