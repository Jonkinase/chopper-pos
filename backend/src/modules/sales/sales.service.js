const db = require('../../config/db');

class SalesService {
  async getAll(filters) {
    const { sucursal_id, fecha_desde, fecha_hasta, cliente_id, tipo_pago, estado, search } = filters;
    let query = `
      SELECT s.*, c.name as customer_name, b.name as branch_name, u.name as user_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN branches b ON s.branch_id = b.id
      JOIN users u ON s.user_id = u.id
      WHERE s.deleted_at IS NULL`;
    const params = [];

    if (sucursal_id) {
      params.push(sucursal_id);
      query += ` AND s.branch_id = $${params.length}`;
    }

    if (fecha_desde) {
      params.push(fecha_desde + ' 00:00:00');
      query += ` AND s.created_at >= $${params.length}`;
    }

    if (fecha_hasta) {
      params.push(fecha_hasta + ' 23:59:59');
      query += ` AND s.created_at <= $${params.length}`;
    }

    if (cliente_id) {
      params.push(cliente_id);
      query += ` AND s.customer_id = $${params.length}`;
    }

    if (tipo_pago) {
      params.push(tipo_pago);
      query += ` AND s.payment_method = $${params.length}`;
    }

    if (estado) {
      params.push(estado);
      query += ` AND s.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.name ILIKE $${params.length} OR s.id::text ILIKE $${params.length})`;
    }

    query += ' ORDER BY s.created_at DESC';
    const { rows } = await db.query(query, params);
    return rows;
  }

  async getById(id) {
    const saleQuery = `
      SELECT s.*, c.name as customer_name, b.name as branch_name, u.name as user_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN branches b ON s.branch_id = b.id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1`;
    const itemsQuery = `
      SELECT si.*, 
             COALESCE(p.name, si.custom_description) as product_name, 
             COALESCE(p.unidad_display, si.unit_type::text) as unidad_display
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = $1`;

    const saleRes = await db.query(saleQuery, [id]);
    if (saleRes.rows.length === 0) throw { status: 404, message: 'Venta no encontrada' };

    const itemsRes = await db.query(itemsQuery, [id]);
    return {
      ...saleRes.rows[0],
      items: itemsRes.rows
    };
  }

  async create(saleData, userId) {
    const { sucursal_id, cliente_id, quote_id, tipo_pago, items, observaciones } = saleData;

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // 1. Validar cliente si es cuenta corriente o si se proporcionó un cliente
      if (tipo_pago === 'cuenta_corriente' && !cliente_id) {
        throw { status: 400, message: 'cliente_id es obligatorio para ventas a cuenta corriente' };
      }

      if (cliente_id) {
        const customerCheck = await client.query(
          'SELECT id FROM customers WHERE id = $1 AND branch_id = $2 AND deleted_at IS NULL',
          [cliente_id, sucursal_id]
        );
        if (customerCheck.rows.length === 0) {
          throw { status: 400, message: 'El cliente no pertenece a esta sucursal' };
        }
      }

      let total = 0;

      // 2. Procesar items y validar stock/branch
      for (const item of items) {
        const { producto_id, cantidad } = item;

        if (producto_id) {
          // Validar que el producto exista en la sucursal y tenga stock
          const invQuery = `
            SELECT i.*, p.type as product_type 
            FROM inventory i 
            JOIN products p ON i.product_id = p.id
            WHERE i.product_id = $1 AND i.branch_id = $2 AND i.deleted_at IS NULL`;
          const invRes = await client.query(invQuery, [producto_id, sucursal_id]);
          
          if (invRes.rows.length === 0) {
            throw { status: 400, message: `El producto ${producto_id} no está disponible en esta sucursal` };
          }

          const inventory = invRes.rows[0];
          if (parseFloat(inventory.stock_actual) < parseFloat(cantidad)) {
            throw { status: 400, message: `Stock insuficiente para el producto ${producto_id}` };
          }
        }

        total += parseFloat(item.subtotal);
      }

      // 3. Crear registro de venta
      const saleQuery = `
        INSERT INTO sales (branch_id, user_id, customer_id, quote_id, payment_method, total, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'completada')
        RETURNING id`;
      const saleRes = await client.query(saleQuery, [
        sucursal_id, userId, cliente_id, quote_id || null, tipo_pago, total
      ]);
      const saleId = saleRes.rows[0].id;

      // 4. Insertar items, descontar stock y registrar movimientos
      for (const item of items) {
        const { producto_id, cantidad, precio_unitario, tipo_precio, subtotal, custom_description } = item;

        let unitType = item.unit_type || 'unidades';
        let pType = 'seco';
        if (producto_id) {
          // Determinar unit_type basado en el producto (esto podría venir del frontend o buscarse)
          const prodRes = await client.query('SELECT type FROM products WHERE id = $1', [producto_id]);
          pType = prodRes.rows[0].type;
          unitType = pType === 'liquido' ? 'litros' : (pType === 'alimento' ? 'kilogramos' : 'unidades');
        }

        // Insertar item de venta
        await client.query(`
          INSERT INTO sale_items (sale_id, product_id, custom_description, unit_type, quantity, unit_price_applied, price_type, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [saleId, producto_id || null, custom_description || null, unitType, cantidad, precio_unitario, tipo_precio || 'menudeo', subtotal]
        );

        if (producto_id) {
          // Descontar stock
          const updateStockQuery = `
            UPDATE inventory 
            SET stock_actual = stock_actual - $1, updated_at = CURRENT_TIMESTAMP
            WHERE product_id = $2 AND branch_id = $3
            RETURNING id`;
          const invUpdateRes = await client.query(updateStockQuery, [cantidad, producto_id, sucursal_id]);
          const inventoryId = invUpdateRes.rows[0].id;

          // Registrar movimiento de inventario
          await client.query(`
            INSERT INTO inventory_movements (inventory_id, user_id, type, quantity, reason)
            VALUES ($1, $2, 'venta', $3, $4)`,
            [inventoryId, userId, -cantidad, `Venta #${saleId}`]
          );
        }
      }

      // 5. Si es cuenta corriente, actualizar deuda y registrar movimiento de cuenta
      if (tipo_pago === 'cuenta_corriente') {
        // Obtener cuenta del cliente
        const accountQuery = 'SELECT id FROM customer_accounts WHERE customer_id = $1';
        const accountRes = await client.query(accountQuery, [cliente_id]);
        
        if (accountRes.rows.length === 0) {
           throw { status: 404, message: 'Cuenta corriente del cliente no encontrada' };
        }
        const accountId = accountRes.rows[0].id;

        // Actualizar balance
        await client.query(`
          UPDATE customer_accounts 
          SET current_balance = current_balance + $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2`,
          [total, accountId]
        );

        // Registrar movimiento de cuenta (cargo)
        await client.query(`
          INSERT INTO account_movements (account_id, sale_id, type, amount, description)
          VALUES ($1, $2, 'cargo', $3, $4)`,
          [accountId, saleId, total, `Cargo por Venta #${saleId}`]
        );
      }

      await client.query('COMMIT');
      return { sale_id: saleId, total };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async cancel(id, userId, reason) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // 1. Obtener venta
      const saleRes = await client.query('SELECT * FROM sales WHERE id = $1 AND status != $2', [id, 'anulada']);
      if (saleRes.rows.length === 0) throw { status: 404, message: 'Venta no encontrada o ya anulada' };
      const sale = saleRes.rows[0];

      // 2. Marcar como anulada
      await client.query('UPDATE sales SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['anulada', id]);

      // 3. Revertir stock y registrar movimientos
      const itemsRes = await client.query('SELECT * FROM sale_items WHERE sale_id = $1', [id]);
      for (const item of itemsRes.rows) {
        if (item.product_id) {
          const updateStockQuery = `
            UPDATE inventory 
            SET stock_actual = stock_actual + $1, updated_at = CURRENT_TIMESTAMP
            WHERE product_id = $2 AND branch_id = $3
            RETURNING id`;
          const invUpdateRes = await client.query(updateStockQuery, [item.quantity, item.product_id, sale.branch_id]);
          
          if (invUpdateRes.rows.length > 0) {
              await client.query(`
                INSERT INTO inventory_movements (inventory_id, user_id, type, quantity, reason)
                VALUES ($1, $2, 'devolucion', $3, $4)`,
                [invUpdateRes.rows[0].id, userId, item.quantity, `Anulación Venta #${id}: ${reason || 'Sin motivo'}`]
              );
          }
        }
      }

      // 4. Si era cuenta corriente, revertir deuda
      if (sale.payment_method === 'cuenta_corriente') {
        const accountQuery = 'SELECT id FROM customer_accounts WHERE customer_id = $1';
        const accountRes = await client.query(accountQuery, [sale.customer_id]);
        if (accountRes.rows.length > 0) {
          const accountId = accountRes.rows[0].id;
          await client.query(`
            UPDATE customer_accounts 
            SET current_balance = current_balance - $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2`,
            [sale.total, accountId]
          );

          await client.query(`
            INSERT INTO account_movements (account_id, sale_id, type, amount, description)
            VALUES ($1, $2, 'abono', $3, $4)`,
            [accountId, id, sale.total, `Anulación de Venta #${id}`]
          );
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new SalesService();
