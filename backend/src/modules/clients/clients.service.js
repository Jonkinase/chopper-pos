const db = require('../../config/db');

class ClientsService {
  async getAll(branchId, search) {
    let query = `
      SELECT c.*, ca.current_balance
      FROM customers c
      LEFT JOIN customer_accounts ca ON c.id = ca.customer_id
      WHERE c.deleted_at IS NULL`;
    const params = [];

    if (branchId) {
      params.push(branchId);
      query += ` AND c.branch_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.name ILIKE $${params.length} OR c.contact_info ILIKE $${params.length})`;
    }

    query += ' ORDER BY c.name ASC';
    const { rows } = await db.query(query, params);
    return rows;
  }

  async create(data) {
    const { name, contact_info, email, phone, address, branch_id } = data;
    
    // Combinamos contacto para la tabla customers según esquema previo o lo extendemos
    const fullContactInfo = JSON.stringify({ email, phone, address });

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO customers (name, contact_info, branch_id)
        VALUES ($1, $2, $3)
        RETURNING *`;
      const { rows } = await client.query(query, [name, fullContactInfo, branch_id]);
      const customer = rows[0];

      // Crear cuenta corriente inicial con balance 0
      await client.query(`
        INSERT INTO customer_accounts (customer_id, current_balance)
        VALUES ($1, 0)`,
        [customer.id]
      );

      await client.query('COMMIT');
      return customer;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(id, data, branchId) {
    const { name, contact_info } = data;
    let query = `
      UPDATE customers
      SET name = $1, contact_info = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND deleted_at IS NULL`;
    const params = [name, contact_info, id];

    if (branchId) {
      params.push(branchId);
      query += ` AND branch_id = $${params.length}`;
    }

    query += ' RETURNING *';
    const { rows } = await db.query(query, params);
    if (rows.length === 0) throw { status: 404, message: 'Cliente no encontrado' };
    return rows[0];
  }

  async getById(id, branchId) {
    let query = `
      SELECT c.*, ca.current_balance
      FROM customers c
      LEFT JOIN customer_accounts ca ON c.id = ca.customer_id
      WHERE c.id = $1 AND c.deleted_at IS NULL`;
    const params = [id];

    if (branchId) {
      params.push(branchId);
      query += ` AND c.branch_id = $${params.length}`;
    }

    const { rows } = await db.query(query, params);
    if (rows.length === 0) throw { status: 404, message: 'Cliente no encontrado' };
    return rows[0];
  }
}

module.exports = new ClientsService();
