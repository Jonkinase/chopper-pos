const db = require('../../config/db');

class InventoryService {
  async getByBranch(sucursalId) {
    if (!sucursalId) throw { status: 400, message: 'sucursal_id es requerido' };

    const query = `
      SELECT 
        i.*, 
        p.name as product_name, p.type as product_type
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.branch_id = $1 AND i.deleted_at IS NULL
      ORDER BY p.name ASC`;
    const { rows } = await db.query(query, [sucursalId]);
    return rows;
  }

  async adjustStock(productId, sucursalId, data, userId) {
    const { quantity, reason, type } = data; // type: 'ajuste_manual', 'entrada', 'devolucion'
    
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Obtener registro de inventario
      const invQuery = 'SELECT id, stock_actual FROM inventory WHERE product_id = $1 AND branch_id = $2 AND deleted_at IS NULL';
      const invRes = await client.query(invQuery, [productId, sucursalId]);
      if (invRes.rows.length === 0) throw { status: 404, message: 'Producto no encontrado en esta sucursal' };
      
      const inventory = invRes.rows[0];
      const newStock = parseFloat(inventory.stock_actual) + parseFloat(quantity);

      // 2. Actualizar stock
      await client.query('UPDATE inventory SET stock_actual = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStock, inventory.id]);

      // 3. Registrar movimiento
      await client.query(`
        INSERT INTO inventory_movements (inventory_id, user_id, type, quantity, reason)
        VALUES ($1, $2, $3, $4, $5)`,
        [inventory.id, userId, type, quantity, reason]
      );

      await client.query('COMMIT');
      return { new_stock: newStock };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getMovements(productId, sucursalId) {
    const query = `
      SELECT m.*, u.name as user_name
      FROM inventory_movements m
      JOIN inventory i ON m.inventory_id = i.id
      JOIN users u ON m.user_id = u.id
      WHERE i.product_id = $1 AND i.branch_id = $2
      ORDER BY m.created_at DESC`;
    const { rows } = await db.query(query, [productId, sucursalId]);
    return rows;
  }
}

module.exports = new InventoryService();
