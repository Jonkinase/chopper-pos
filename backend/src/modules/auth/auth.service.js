const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../../config/db');

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
      throw { status: 401, message: 'Credenciales inválidas' };
    }

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
