const db = require('../../config/db');
const salesService = require('../sales/sales.service');

class QuotesService {
  async getAll(filters) {
    const { sucursal_id, estado } = filters;
    let query = `
      SELECT q.*, c.name as customer_name, b.name as branch_name, u.name as user_name
      FROM quotes q
      LEFT JOIN customers c ON q.customer_id = c.id
      JOIN branches b ON q.branch_id = b.id
      JOIN users u ON q.user_id = u.id
      WHERE q.deleted_at IS NULL`;
    const params = [];

    if (sucursal_id) {
      params.push(sucursal_id);
      query += ` AND q.branch_id = $${params.length}`;
    }

    if (estado) {
      params.push(estado);
      query += ` AND q.status = $${params.length}`;
    }

    query += ' ORDER BY q.created_at DESC';
    const { rows } = await db.query(query, params);
    return rows;
  }

  async getById(id) {
    const quoteQuery = `
      SELECT q.*, c.name as customer_name, c.contact_info as customer_contact, 
             b.name as branch_name, b.logo_url, b.razon_social, b.cuit, b.address as branch_address
      FROM quotes q
      LEFT JOIN customers c ON q.customer_id = c.id
      JOIN branches b ON q.branch_id = b.id
      WHERE q.id = $1`;
    const itemsQuery = `
      SELECT qi.*, p.name as product_name
      FROM quote_items qi
      JOIN products p ON qi.product_id = p.id
      WHERE qi.quote_id = $1`;

    const quoteRes = await db.query(quoteQuery, [id]);
    if (quoteRes.rows.length === 0) throw { status: 404, message: 'Presupuesto no encontrado' };

    const itemsRes = await db.query(itemsQuery, [id]);
    return {
      ...quoteRes.rows[0],
      items: itemsRes.rows
    };
  }

  async create(quoteData, userId) {
    const { sucursal_id, cliente_id, items, total } = quoteData;

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const quoteQuery = `
        INSERT INTO quotes (branch_id, user_id, customer_id, total, status)
        VALUES ($1, $2, $3, $4, 'borrador')
        RETURNING id`;
      const quoteRes = await client.query(quoteQuery, [sucursal_id, userId, cliente_id, total]);
      const quoteId = quoteRes.rows[0].id;

      for (const item of items) {
        await client.query(`
          INSERT INTO quote_items (quote_id, product_id, unit_type, quantity, unit_price_applied, price_type, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [quoteId, item.producto_id, item.unit_type || 'unidades', item.cantidad, item.precio_unitario, item.tipo_precio, item.subtotal]
        );
      }

      await client.query('COMMIT');
      return { quote_id: quoteId };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(id, quoteData) {
    const { items, total, cliente_id } = quoteData;
    
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const check = await client.query('SELECT status FROM quotes WHERE id = $1', [id]);
      if (check.rows[0].status !== 'borrador') {
        throw { status: 400, message: 'Solo se pueden editar presupuestos en estado borrador' };
      }

      await client.query('UPDATE quotes SET total = $1, customer_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [total, cliente_id, id]);
      await client.query('DELETE FROM quote_items WHERE quote_id = $1', [id]);

      for (const item of items) {
        await client.query(`
          INSERT INTO quote_items (quote_id, product_id, unit_type, quantity, unit_price_applied, price_type, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, item.producto_id, item.unit_type || 'unidades', item.cantidad, item.precio_unitario, item.tipo_precio, item.subtotal]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateStatus(id, status) {
    // 1. Verify existence
    const check = await db.query('SELECT id FROM quotes WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (check.rows.length === 0) {
      throw { status: 404, message: 'Presupuesto no encontrado' };
    }

    const query = 'UPDATE quotes SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id';
    await db.query(query, [status, id]);
    
    // 2. Return updated quote
    return await this.getById(id);
  }

  async convertToSale(id, userId, tipo_pago) {
    const quote = await this.getById(id);
    if (quote.status !== 'aprobado') {
      throw { status: 400, message: 'El presupuesto debe estar aprobado para convertirse en venta' };
    }

    const saleData = {
      sucursal_id: quote.branch_id,
      cliente_id: quote.customer_id,
      tipo_pago: tipo_pago || 'contado',
      items: quote.items.map(item => ({
        producto_id: item.product_id,
        cantidad: item.quantity,
        precio_unitario: item.unit_price_applied,
        tipo_precio: item.price_type,
        subtotal: item.subtotal
      })),
      quote_id: id // Necesitaríamos agregar esta columna a la tabla sales
    };

    const sale = await salesService.create(saleData, userId);
    await this.updateStatus(id, 'convertido_a_venta');
    
    return sale;
  }

  async delete(id) {
    console.log(`Eliminando presupuesto ID: ${id}`);
    const check = await db.query('SELECT status FROM quotes WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (check.rows.length === 0) throw { status: 404, message: 'Presupuesto no encontrado' };
    if (check.rows[0].status !== 'borrador') {
      throw { status: 400, message: 'Solo se pueden eliminar presupuestos en borrador' };
    }
    const query = 'UPDATE quotes SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1';
    await db.query(query, [id]);
  }
}

module.exports = new QuotesService();
