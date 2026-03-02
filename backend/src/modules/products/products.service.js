const db = require('../../config/db');

class ProductsService {
  async getAll(sucursalId) {
    if (!sucursalId) throw { status: 400, message: 'sucursal_id es requerido' };

    const query = `
      SELECT 
        p.id, p.name, p.type, p.cost, p.description,
        i.id as inventory_id, i.branch_id, i.retail_price, i.wholesale_price, 
        i.wholesale_min_qty, i.stock_actual
      FROM products p
      INNER JOIN inventory i ON p.id = i.product_id
      WHERE i.branch_id = $1 AND p.deleted_at IS NULL AND i.deleted_at IS NULL
      ORDER BY p.name ASC`;
    
    const { rows } = await db.query(query, [sucursalId]);
    return rows;
  }

  async create(data, userId) {
    const { 
      nombre, tipo, sucursal_id, costo, precio_menudeo, 
      tiene_mayoreo, precio_mayoreo, cantidad_minima_mayoreo, 
      stock_actual, description
    } = data;

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const productQuery = `
        INSERT INTO products (name, type, cost, description)
        VALUES ($1, $2, $3, $4)
        RETURNING id`;
      const productRes = await client.query(productQuery, [nombre, tipo, costo, description]);
      const productId = productRes.rows[0].id;

      const inventoryQuery = `
        INSERT INTO inventory (branch_id, product_id, retail_price, wholesale_price, wholesale_min_qty, stock_actual)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`;
      const inventoryRes = await client.query(inventoryQuery, [
        sucursal_id, productId, precio_menudeo, 
        tiene_mayoreo ? precio_mayoreo : null, 
        tiene_mayoreo ? cantidad_minima_mayoreo : null, 
        stock_actual
      ]);

      if (stock_actual > 0) {
        await client.query(`
          INSERT INTO inventory_movements (inventory_id, user_id, type, quantity, reason)
          VALUES ($1, $2, $3, $4, $5)`,
          [inventoryRes.rows[0].id, userId, 'entrada', stock_actual, 'Carga inicial de producto']
        );
      }

      await client.query('COMMIT');
      return { ...productRes.rows[0], ...inventoryRes.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(id, data) {
    const { 
      nombre, tipo, costo, description,
      precio_menudeo, tiene_mayoreo, precio_mayoreo, 
      cantidad_minima_mayoreo, sucursal_id 
    } = data;

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        UPDATE products 
        SET name = $1, type = $2, cost = $3, description = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5`,
        [nombre, tipo, costo, description, id]
      );

      if (sucursal_id) {
        await client.query(`
          UPDATE inventory
          SET retail_price = $1, wholesale_price = $2, wholesale_min_qty = $3, updated_at = CURRENT_TIMESTAMP
          WHERE product_id = $4 AND branch_id = $5`,
          [
            precio_menudeo, 
            tiene_mayoreo ? precio_mayoreo : null, 
            tiene_mayoreo ? cantidad_minima_mayoreo : null, 
            id, sucursal_id
          ]
        );
      }

      await client.query('COMMIT');
      return { message: 'Producto actualizado correctamente' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async delete(id) {
    const query = 'UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1';
    await db.query(query, [id]);
    // También soft delete de inventario relacionado
    await db.query('UPDATE inventory SET deleted_at = CURRENT_TIMESTAMP WHERE product_id = $1', [id]);
  }

  async getById(id, sucursalId) {
    const query = `
      SELECT 
        p.*, 
        i.retail_price, i.wholesale_price, i.wholesale_min_qty, i.stock_actual
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id AND i.branch_id = $2
      WHERE p.id = $1 AND p.deleted_at IS NULL`;
    const { rows } = await db.query(query, [id, sucursalId]);
    if (rows.length === 0) throw { status: 404, message: 'Producto no encontrado' };
    return rows[0];
  }
}

module.exports = new ProductsService();
