const db = require('../../config/db');

class AccountsService {
  async getAll(branchId) {
    let query = `
      SELECT ca.id as account_id, c.id as customer_id, c.name as customer_name, ca.current_balance, ca.updated_at
      FROM customer_accounts ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE c.deleted_at IS NULL`;
    const params = [];

    if (branchId) {
      query += ` AND c.branch_id = $1`;
      params.push(branchId);
    }

    query += ' ORDER BY ca.current_balance DESC, c.name ASC';
    const { rows } = await db.query(query, params);
    return rows;
  }

  async getDetail(customerId, branchId) {
    let query = `
      SELECT ca.*, c.name as customer_name, c.contact_info
      FROM customer_accounts ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE c.id = $1 AND c.deleted_at IS NULL`;
    const params = [customerId];

    if (branchId) {
      params.push(branchId);
      query += ` AND c.branch_id = $2`;
    }

    const { rows } = await db.query(query, params);
    if (rows.length === 0) throw { status: 404, message: 'Cuenta no encontrada' };

    const movements = await this.getMovements(customerId, 50, 0);

    return {
      account: rows[0],
      recent_movements: movements
    };
  }

  async registerPayment(customerId, data, userId, branchId) {
    const { monto, metodo_pago, observaciones } = data;
    
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // 1. Obtener cuenta validando sucursal
      let accountQuery = `
        SELECT ca.id, ca.current_balance 
        FROM customer_accounts ca
        JOIN customers c ON ca.customer_id = c.id
        WHERE ca.customer_id = $1`;
      const params = [customerId];
      
      if (branchId) {
        params.push(branchId);
        accountQuery += ` AND c.branch_id = $2`;
      }

      const accountRes = await client.query(accountQuery, params);
      if (accountRes.rows.length === 0) throw { status: 404, message: 'Cuenta no encontrada' };
      
      const account = accountRes.rows[0];
      const newBalance = parseFloat(account.current_balance) - parseFloat(monto);

      // 2. Actualizar balance
      await client.query(`
        UPDATE customer_accounts 
        SET current_balance = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2`,
        [newBalance, account.id]
      );

      // 3. Registrar movimiento (abono)
      const desc = `Pago (${metodo_pago}): ${observaciones || 'Sin observaciones'}`;
      await client.query(`
        INSERT INTO account_movements (account_id, type, amount, description)
        VALUES ($1, 'abono', $2, $3)`,
        [account.id, monto, desc]
      );

      await client.query('COMMIT');
      return { new_balance: newBalance };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getMovements(customerId, limit = 20, offset = 0) {
    const query = `
      SELECT am.*
      FROM account_movements am
      JOIN customer_accounts ca ON am.account_id = ca.id
      WHERE ca.customer_id = $1
      ORDER BY am.created_at DESC
      LIMIT $2 OFFSET $3`;
    const { rows } = await db.query(query, [customerId, limit, offset]);
    return rows;
  }
}

module.exports = new AccountsService();
