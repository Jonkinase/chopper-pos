const db = require('../../config/db');

class ClientsService {
  async getAll(branchId, search) {
    let query = `
      SELECT c.*, ca.current_balance, ca.overdue_days_limit
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
      query += ` AND (
        c.name ILIKE $${params.length}
        OR COALESCE(c.business_name, '') ILIKE $${params.length}
        OR COALESCE(c.cuit, '') ILIKE $${params.length}
        OR c.contact_info ILIKE $${params.length}
      )`;
    }

    query += ' ORDER BY c.name ASC';
    const { rows } = await db.query(query, params);
    return rows;
  }

  async create(data) {
    const {
      name,
      contact_info,
      email,
      phone,
      address,
      branch_id,
      overdue_days_limit,
      business_name,
      cuit,
      iva_condition,
      fiscal_address,
    } = data;

    const fullContactInfo = contact_info || JSON.stringify({ email, phone, address });
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO customers (
          name, business_name, cuit, iva_condition, fiscal_address, contact_info, branch_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`;
      const { rows } = await client.query(query, [
        name,
        business_name || null,
        cuit || null,
        iva_condition || null,
        fiscal_address || null,
        fullContactInfo,
        branch_id,
      ]);
      const customer = rows[0];

      await client.query(
        `INSERT INTO customer_accounts (customer_id, current_balance, overdue_days_limit)
         VALUES ($1, 0, $2)`,
        [customer.id, overdue_days_limit || 1]
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
    const {
      name,
      contact_info,
      overdue_days_limit,
      business_name,
      cuit,
      iva_condition,
      fiscal_address,
    } = data;
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      let customerQuery = `
        UPDATE customers
        SET name = $1,
            contact_info = $2,
            business_name = $3,
            cuit = $4,
            iva_condition = $5,
            fiscal_address = $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7 AND deleted_at IS NULL`;
      const customerParams = [
        name,
        contact_info,
        business_name || null,
        cuit || null,
        iva_condition || null,
        fiscal_address || null,
        id,
      ];

      if (branchId) {
        customerParams.push(branchId);
        customerQuery += ` AND branch_id = $${customerParams.length}`;
      }

      customerQuery += ' RETURNING *';
      const { rows } = await client.query(customerQuery, customerParams);
      if (rows.length === 0) throw { status: 404, message: 'Cliente no encontrado' };

      await client.query(
        `UPDATE customer_accounts
         SET overdue_days_limit = $1, updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = $2`,
        [overdue_days_limit || 1, id]
      );

      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getById(id, branchId) {
    let query = `
      SELECT c.*, ca.current_balance, ca.overdue_days_limit
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
