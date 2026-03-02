const db = require('../../config/db');

class BranchesService {
  async getAll() {
    const query = 'SELECT * FROM branches WHERE deleted_at IS NULL ORDER BY name ASC';
    const { rows } = await db.query(query);
    return rows;
  }

  async create(data) {
    const { name, address } = data;
    const query = `
      INSERT INTO branches (name, address)
      VALUES ($1, $2)
      RETURNING *`;
    const { rows } = await db.query(query, [name, address]);
    return rows[0];
  }

  async update(id, data) {
    const { name, address } = data;
    const query = `
      UPDATE branches
      SET name = $1, address = $2
      WHERE id = $3 AND deleted_at IS NULL
      RETURNING *`;
    const { rows } = await db.query(query, [name, address, id]);
    if (rows.length === 0) throw { status: 404, message: 'Sucursal no encontrada' };
    return rows[0];
  }

  async delete(id) {
    const query = 'UPDATE branches SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1';
    await db.query(query, [id]);
  }

  async getStats(id) {
    // Verificar si la sucursal existe
    const branchCheck = await db.query('SELECT id FROM branches WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (branchCheck.rows.length === 0) throw { status: 404, message: 'Sucursal no encontrada' };

    // Usuarios asignados
    const usersQuery = 'SELECT COUNT(*) FROM users WHERE branch_id = $1 AND deleted_at IS NULL';
    const usersCount = (await db.query(usersQuery, [id])).rows[0].count;

    // Productos en inventario (con stock > 0)
    const inventoryQuery = 'SELECT COUNT(*) FROM inventory WHERE branch_id = $1 AND stock_actual > 0 AND deleted_at IS NULL';
    const inventoryCount = (await db.query(inventoryQuery, [id])).rows[0].count;

    // Ventas del día
    const salesQuery = `
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
      FROM sales
      WHERE branch_id = $1 AND status = 'completada' AND created_at >= CURRENT_DATE`;
    const salesStats = (await db.query(salesQuery, [id])).rows[0];

    return {
      users_count: parseInt(usersCount),
      inventory_count: parseInt(inventoryCount),
      sales_today_count: parseInt(salesStats.count),
      sales_today_total: parseFloat(salesStats.total)
    };
  }
}

module.exports = new BranchesService();
