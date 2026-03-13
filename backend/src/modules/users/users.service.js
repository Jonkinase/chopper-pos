const bcrypt = require('bcryptjs');
const db = require('../../config/db');

class UsersService {
  async recordAccessLog(userId, action, ipAddress, deviceInfo) {
    const query = 'INSERT INTO access_logs (user_id, action, ip_address, device_info) VALUES ($1, $2, $3, $4)';
    await db.query(query, [userId, action, ipAddress, deviceInfo]);
  }

  async getAccessLogs(userId, limit = 50) {
    const query = 'SELECT action, ip_address, device_info, created_at FROM access_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2';
    const { rows } = await db.query(query, [userId, limit]);
    return rows;
  }

  async getAll(role, branchId) {
    let query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.branch_id, u.created_at,
        al.created_at as last_login_at,
        al.device_info as last_login_device
      FROM users u
      LEFT JOIN LATERAL (
        SELECT created_at, device_info 
        FROM access_logs 
        WHERE user_id = u.id AND action = 'login'
        ORDER BY created_at DESC 
        LIMIT 1
      ) al ON true
      WHERE u.deleted_at IS NULL
    `;
    const params = [];

    if (role === 'encargado') {
      query += ' AND u.branch_id = $1';
      params.push(branchId);
    }

    const { rows } = await db.query(query, params);
    return rows;
  }

  async create(userData, creatorRole, creatorBranchId) {
    const { name, email, password, role, branch_id } = userData;

    // Validar permisos de creación
    if (creatorRole === 'encargado') {
      if (role !== 'cajero' || branch_id !== creatorBranchId) {
        throw { status: 403, message: 'Un encargado solo puede crear cajeros para su sucursal' };
      }
    }

    if (role !== 'admin' && !branch_id) {
      throw { status: 400, message: 'sucursal_id es obligatorio para este rol' };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, email, password_hash, role, branch_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, branch_id';
    const { rows } = await db.query(query, [name, email, passwordHash, role, branch_id]);

    return rows[0];
  }

  async update(id, userData, creatorRole, creatorBranchId) {
    // Primero obtener el usuario actual para verificar permisos
    const currentQuery = 'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL';
    const current = (await db.query(currentQuery, [id])).rows[0];
    if (!current) throw { status: 404, message: 'Usuario no encontrado' };

    if (creatorRole === 'encargado' && current.branch_id !== creatorBranchId) {
      throw { status: 403, message: 'No tienes permiso para editar este usuario' };
    }

    const { name, email, role, branch_id } = userData;
    const query = 'UPDATE users SET name = $1, email = $2, role = $3, branch_id = $4 WHERE id = $5 RETURNING id, name, email, role, branch_id';
    const { rows } = await db.query(query, [name, email, role, branch_id, id]);

    return rows[0];
  }

  async delete(id, creatorRole, creatorBranchId) {
    const currentQuery = 'SELECT * FROM users WHERE id = $1';
    const current = (await db.query(currentQuery, [id])).rows[0];
    if (!current) throw { status: 404, message: 'Usuario no encontrado' };

    if (creatorRole === 'encargado' && current.branch_id !== creatorBranchId) {
      throw { status: 403, message: 'No tienes permiso para eliminar este usuario' };
    }

    const query = 'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1';
    await db.query(query, [id]);
  }

  async changePassword(id, newPassword, creatorRole, creatorBranchId) {
    const currentQuery = 'SELECT * FROM users WHERE id = $1';
    const current = (await db.query(currentQuery, [id])).rows[0];
    if (!current) throw { status: 404, message: 'Usuario no encontrado' };

    if (creatorRole === 'encargado' && current.branch_id !== creatorBranchId) {
      throw { status: 403, message: 'No tienes permiso para cambiar esta contraseña' };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE users SET password_hash = $1 WHERE id = $2';
    await db.query(query, [passwordHash, id]);
  }
}

module.exports = new UsersService();
