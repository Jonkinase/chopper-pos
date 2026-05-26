const db = require('../../config/db');
const notificationsService = require('../notifications/notifications.service');
const configService = require('../config/config.service');
const arcaService = require('./arca.service');
const { generateInvoicePdfBuffer } = require('./sales.pdf');
const {
  INVOICE_TYPES,
  round2,
  sanitizeText,
  calculateIncludedVatBreakdown,
  normalizeBillingRequest,
  validateArcaAmounts,
} = require('./sales.fiscal');

class SalesService {
  mapBillingRow(row) {
    if (!row || !row.billing_status) {
      return {
        billing_status: 'not_requested',
        invoice_type: null,
      };
    }

    return {
      billing_status: row.billing_status,
      invoice_type: row.invoice_type,
      condicion_venta: row.condicion_venta,
      cae: row.cae,
      cae_vto: row.cae_vto,
      comprobante_nro: row.comprobante_nro,
      punto_venta: row.punto_venta,
      tipo_comprobante: row.tipo_comprobante,
      fecha_emision: row.fecha_emision,
      periodo_desde: row.periodo_desde,
      periodo_hasta: row.periodo_hasta,
      approved_net_amount: row.approved_net_amount !== null ? Number(row.approved_net_amount) : null,
      approved_vat_amount: row.approved_vat_amount !== null ? Number(row.approved_vat_amount) : null,
      approved_total_amount: row.approved_total_amount !== null ? Number(row.approved_total_amount) : null,
      last_error: row.last_error,
      retry_count: row.retry_count || 0,
      last_attempt_at: row.last_attempt_at,
      receiver_name: row.receiver_name,
      receiver_business_name: row.receiver_business_name,
      receiver_cuit: row.receiver_cuit,
      receiver_iva_condition: row.receiver_iva_condition,
      receiver_fiscal_address: row.receiver_fiscal_address,
      request_payload: row.request_payload || null,
      response_payload: row.response_payload || null,
    };
  }

  async getAll(filters) {
    const { sucursal_id, fecha_desde, fecha_hasta, cliente_id, tipo_pago, estado, search } = filters;
    let query = `
      SELECT s.*, c.name AS customer_name, b.name AS branch_name, u.name AS user_name,
             sb.billing_status, sb.invoice_type, sb.cae, sb.comprobante_nro, sb.last_error
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN branches b ON s.branch_id = b.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN sale_billing sb ON sb.sale_id = s.id
      WHERE s.deleted_at IS NULL`;
    const params = [];

    if (sucursal_id) {
      params.push(sucursal_id);
      query += ` AND s.branch_id = $${params.length}`;
    }

    if (fecha_desde) {
      params.push(`${fecha_desde} 00:00:00`);
      query += ` AND s.created_at >= $${params.length}`;
    }

    if (fecha_hasta) {
      params.push(`${fecha_hasta} 23:59:59`);
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
    return rows.map((row) => ({
      ...row,
      billing: this.mapBillingRow(row),
    }));
  }

  async getById(id) {
    const saleQuery = `
      SELECT s.*, c.name AS customer_name, c.business_name AS customer_business_name,
             c.cuit AS customer_cuit, c.iva_condition AS customer_iva_condition,
             c.fiscal_address AS customer_fiscal_address,
             b.name AS branch_name, u.name AS user_name,
             sb.billing_status, sb.invoice_type, sb.condicion_venta, sb.request_payload,
             sb.response_payload, sb.last_error, sb.cae, sb.cae_vto, sb.comprobante_nro,
             sb.punto_venta, sb.tipo_comprobante, sb.fecha_emision, sb.periodo_desde,
             sb.periodo_hasta, sb.approved_net_amount, sb.approved_vat_amount,
             sb.approved_total_amount, sb.receiver_name, sb.receiver_business_name,
             sb.receiver_cuit, sb.receiver_iva_condition, sb.receiver_fiscal_address,
             sb.retry_count, sb.last_attempt_at
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN branches b ON s.branch_id = b.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN sale_billing sb ON sb.sale_id = s.id
      WHERE s.id = $1`;
    const itemsQuery = `
      SELECT si.*,
             COALESCE(p.name, si.custom_description) AS product_name,
             COALESCE(p.unidad_display, si.unit_type::text) AS unidad_display
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = $1`;

    const saleRes = await db.query(saleQuery, [id]);
    if (saleRes.rows.length === 0) throw { status: 404, message: 'Venta no encontrada' };

    const itemsRes = await db.query(itemsQuery, [id]);
    const billing = this.mapBillingRow(saleRes.rows[0]);
    const fiscal = calculateIncludedVatBreakdown(itemsRes.rows);

    return {
      ...saleRes.rows[0],
      items: itemsRes.rows.map((item, index) => ({
        ...item,
        billing_net_unit_price: fiscal.lines[index]?.netUnitPrice || null,
      })),
      billing,
      fiscal_summary: {
        net_amount: fiscal.netAmount,
        vat_amount: fiscal.vatAmount,
        total_amount: fiscal.totalAmount,
      },
    };
  }

  async create(saleData, userId) {
    const { sucursal_id, cliente_id, quote_id, tipo_pago, items, billing } = saleData;
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      if (tipo_pago === 'cuenta_corriente' && !cliente_id) {
        throw { status: 400, message: 'cliente_id es obligatorio para ventas a cuenta corriente' };
      }

      let customer = null;
      if (cliente_id) {
        const customerCheck = await client.query(
          `SELECT id, name, business_name, cuit, iva_condition, fiscal_address
           FROM customers
           WHERE id = $1 AND branch_id = $2 AND deleted_at IS NULL`,
          [cliente_id, sucursal_id]
        );

        if (customerCheck.rows.length === 0) {
          throw { status: 400, message: 'El cliente no pertenece a esta sucursal' };
        }
        customer = customerCheck.rows[0];
      }

      let total = 0;
      const pendingNotifications = [];

      for (const item of items) {
        const { producto_id, cantidad } = item;

        if (producto_id) {
          const invQuery = `
            SELECT i.*, p.type AS product_type, p.name AS product_name, p.requires_stock
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            WHERE i.product_id = $1 AND i.branch_id = $2 AND i.deleted_at IS NULL`;
          const invRes = await client.query(invQuery, [producto_id, sucursal_id]);

          if (invRes.rows.length === 0) {
            throw { status: 400, message: `El producto ${producto_id} no está disponible en esta sucursal` };
          }

          const inventory = invRes.rows[0];
          if (inventory.requires_stock) {
            if (parseFloat(inventory.stock_actual) < parseFloat(cantidad)) {
              throw { status: 400, message: `Stock insuficiente para el producto ${inventory.product_name}` };
            }

            const nuevoStock = parseFloat(inventory.stock_actual) - parseFloat(cantidad);
            if (nuevoStock <= parseFloat(inventory.stock_minimo || 0)) {
              pendingNotifications.push({
                type: 'LOW_STOCK',
                title: 'Alerta de Stock Bajo',
                message: `El producto "${inventory.product_name}" ha alcanzado un nivel bajo (${nuevoStock} unidades restantes).`,
                related_id: producto_id,
                branch_id: sucursal_id,
              });
            }
          }
        }

        total += parseFloat(item.subtotal);
      }
      total = round2(total);

      const saleQuery = `
        INSERT INTO sales (branch_id, user_id, customer_id, quote_id, payment_method, total, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'completada')
        RETURNING id`;
      const saleRes = await client.query(saleQuery, [
        sucursal_id,
        userId,
        cliente_id || null,
        quote_id || null,
        tipo_pago,
        total,
      ]);
      const saleId = saleRes.rows[0].id;

      for (const item of items) {
        const { producto_id, cantidad, precio_unitario, tipo_precio, subtotal, custom_description } = item;
        let unitType = item.unit_type || 'unidades';

        if (producto_id) {
          const prodRes = await client.query('SELECT type, requires_stock FROM products WHERE id = $1', [producto_id]);
          const product = prodRes.rows[0];
          unitType = product.type === 'liquido' ? 'litros' : product.type === 'alimento' ? 'kilogramos' : 'unidades';
        }

        await client.query(
          `INSERT INTO sale_items (sale_id, product_id, custom_description, unit_type, quantity, unit_price_applied, price_type, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [saleId, producto_id || null, custom_description || null, unitType, cantidad, precio_unitario, tipo_precio || 'menudeo', subtotal]
        );

        if (producto_id) {
          const prodRes = await client.query('SELECT requires_stock FROM products WHERE id = $1', [producto_id]);
          const requiresStock = prodRes.rows[0].requires_stock;
          if (requiresStock) {
            const invUpdateRes = await client.query(
              `UPDATE inventory
               SET stock_actual = stock_actual - $1, updated_at = CURRENT_TIMESTAMP
               WHERE product_id = $2 AND branch_id = $3
               RETURNING id`,
              [cantidad, producto_id, sucursal_id]
            );
            const inventoryId = invUpdateRes.rows[0].id;

            await client.query(
              `INSERT INTO inventory_movements (inventory_id, user_id, type, quantity, reason)
               VALUES ($1, $2, 'venta', $3, $4)`,
              [inventoryId, userId, -cantidad, `Venta #${saleId}`]
            );
          }
        }
      }

      if (tipo_pago === 'cuenta_corriente') {
        const accountRes = await client.query('SELECT id FROM customer_accounts WHERE customer_id = $1', [cliente_id]);
        if (accountRes.rows.length === 0) {
          throw { status: 404, message: 'Cuenta corriente del cliente no encontrada' };
        }
        const accountId = accountRes.rows[0].id;

        await client.query(
          `UPDATE customer_accounts
           SET current_balance = current_balance + $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [total, accountId]
        );

        await client.query(
          `INSERT INTO account_movements (account_id, sale_id, type, amount, description)
           VALUES ($1, $2, 'cargo', $3, $4)`,
          [accountId, saleId, total, `Cargo por Venta #${saleId}`]
        );
      }

      let normalizedBilling = null;
      if (billing?.emit) {
        normalizedBilling = normalizeBillingRequest(billing, customer);
        await client.query(
          `INSERT INTO sale_billing (
             sale_id, billing_status, invoice_type, condicion_venta,
             receiver_name, receiver_business_name, receiver_cuit,
             receiver_iva_condition, receiver_fiscal_address
           ) VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $8)`,
          [
            saleId,
            normalizedBilling.invoice_type,
            normalizedBilling.condicion_venta,
            normalizedBilling.receiver.name,
            normalizedBilling.receiver.business_name,
            normalizedBilling.receiver.cuit,
            normalizedBilling.receiver.iva_condition,
            normalizedBilling.receiver.fiscal_address,
          ]
        );
      }

      await client.query('COMMIT');

      const rawLimit = await configService.get('high_sale_limit');
      const highSaleLimit = rawLimit ? parseFloat(rawLimit) : 10000;

      if (total >= highSaleLimit) {
        pendingNotifications.push({
          type: 'HIGH_SALE',
          title: 'Venta Inusualmente Alta',
          message: `Se ha registrado una venta por un total de $${total}.`,
          related_id: saleId,
          branch_id: sucursal_id,
        });
      }

      for (const notification of pendingNotifications) {
        notificationsService.createNotification(notification).catch(console.error);
      }

      const response = { sale_id: saleId, total };
      if (normalizedBilling) {
        response.billing = await this.processBilling(saleId, { retryIncrement: false });
      }
      return response;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async processBilling(saleId, options = {}) {
    const sale = await this.getById(saleId);
    const currentBilling = sale.billing;

    if (sale.status !== 'completada') {
      throw { status: 400, message: 'Solo se puede facturar una venta completada.' };
    }

    if (!currentBilling || currentBilling.billing_status === 'not_requested') {
      throw { status: 400, message: 'La venta no tiene una solicitud de facturación asociada.' };
    }

    const invoiceType = INVOICE_TYPES[currentBilling.invoice_type];
    if (!invoiceType) {
      throw { status: 400, message: 'La venta no tiene un tipo de comprobante válido.' };
    }

    const runtime = await arcaService.getRuntimeConfig();
    const fiscal = calculateIncludedVatBreakdown(sale.items);
    const fechaEmision = new Date().toISOString().slice(0, 10);
    const payload = arcaService.buildPayload({
      runtime,
      sale,
      fiscal,
      billing: {
        tipoComprobante: invoiceType.tipoComprobante,
        fechaEmision,
        condicionVenta: currentBilling.condicion_venta || runtime.condicionVentaDefault,
        receiver: {
          name: currentBilling.receiver_name,
          business_name: currentBilling.receiver_business_name,
          cuit: currentBilling.receiver_cuit,
          iva_condition: currentBilling.receiver_iva_condition,
          fiscal_address: currentBilling.receiver_fiscal_address,
        },
      },
    });

    const result = await arcaService.emitInvoice(payload, fiscal);
    if (!result.ok) {
      const failedRow = await this.updateBillingFailure(saleId, payload, result.response, result.error, options.retryIncrement);
      return this.mapBillingRow(failedRow);
    }

    const normalized = {
      ...result.data,
      fecha_emision: result.data.fecha_emision || fechaEmision,
      tipo_comprobante: result.data.tipo_comprobante || invoiceType.tipoComprobante,
      punto_venta: result.data.punto_venta || runtime.puntoVenta,
      monto_total: result.data.monto_total ?? fiscal.totalAmount,
      imp_neto: result.data.imp_neto ?? fiscal.netAmount,
      imp_iva: result.data.imp_iva ?? fiscal.vatAmount,
    };

    validateArcaAmounts(fiscal, normalized);

    const approvedRow = await this.updateBillingSuccess(
      saleId,
      payload,
      result.response,
      normalized,
      options.retryIncrement
    );

    return this.mapBillingRow(approvedRow);
  }

  async updateBillingFailure(saleId, payload, response, errorMessage, retryIncrement) {
    const query = `
      UPDATE sale_billing
      SET billing_status = 'failed',
          request_payload = $2::jsonb,
          response_payload = $3::jsonb,
          last_error = $4,
          last_attempt_at = CURRENT_TIMESTAMP,
          retry_count = retry_count + $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE sale_id = $1
      RETURNING *`;

    const { rows } = await db.query(query, [
      saleId,
      JSON.stringify(payload),
      JSON.stringify(response || {}),
      errorMessage,
      retryIncrement ? 1 : 0,
    ]);
    return rows[0];
  }

  async updateBillingSuccess(saleId, payload, response, normalized, retryIncrement) {
    const query = `
      UPDATE sale_billing
      SET billing_status = 'approved',
          request_payload = $2::jsonb,
          response_payload = $3::jsonb,
          last_error = NULL,
          cae = $4,
          cae_vto = $5,
          comprobante_nro = $6,
          punto_venta = $7,
          tipo_comprobante = $8,
          fecha_emision = $9,
          periodo_desde = $10,
          periodo_hasta = $11,
          approved_net_amount = $12,
          approved_vat_amount = $13,
          approved_total_amount = $14,
          last_attempt_at = CURRENT_TIMESTAMP,
          retry_count = retry_count + $15,
          updated_at = CURRENT_TIMESTAMP
      WHERE sale_id = $1
      RETURNING *`;

    const { rows } = await db.query(query, [
      saleId,
      JSON.stringify(payload),
      JSON.stringify(response || {}),
      normalized.cae,
      normalized.cae_vto,
      normalized.comprobante_nro || null,
      normalized.punto_venta,
      normalized.tipo_comprobante,
      normalized.fecha_emision,
      normalized.periodo_desde,
      normalized.periodo_hasta,
      normalized.imp_neto,
      normalized.imp_iva,
      normalized.monto_total,
      retryIncrement ? 1 : 0,
    ]);
    return rows[0];
  }

  async retryBilling(id) {
    const sale = await this.getById(id);
    if (!sale.billing || sale.billing.billing_status === 'not_requested') {
      throw { status: 400, message: 'La venta no tiene facturación solicitada.' };
    }
    if (!['pending', 'failed'].includes(sale.billing.billing_status)) {
      throw { status: 400, message: 'Solo se puede reintentar una factura pendiente o fallida.' };
    }

    return this.processBilling(id, { retryIncrement: true });
  }

  async generateInvoicePdf(id) {
    const sale = await this.getById(id);
    if (sale.billing.billing_status !== 'approved') {
      throw { status: 400, message: 'La factura todavía no fue aprobada por ARCA.' };
    }

    const config = await configService.getAll();
    return generateInvoicePdfBuffer(sale, config);
  }

  async cancel(id, userId, reason) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const saleRes = await client.query(
        `SELECT s.*, sb.billing_status
         FROM sales s
         LEFT JOIN sale_billing sb ON sb.sale_id = s.id
         WHERE s.id = $1 AND s.status != $2`,
        [id, 'anulada']
      );
      if (saleRes.rows.length === 0) throw { status: 404, message: 'Venta no encontrada o ya anulada' };
      const sale = saleRes.rows[0];

      if (sale.billing_status === 'approved') {
        throw { status: 400, message: 'La venta ya fue facturada en ARCA. La anulación fiscal requiere NC/ND y no está disponible en este flujo.' };
      }

      await client.query('UPDATE sales SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['anulada', id]);

      const itemsRes = await client.query(
        `SELECT si.*, p.requires_stock
         FROM sale_items si
         LEFT JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = $1`,
        [id]
      );

      for (const item of itemsRes.rows) {
        if (item.product_id && item.requires_stock) {
          const invUpdateRes = await client.query(
            `UPDATE inventory
             SET stock_actual = stock_actual + $1, updated_at = CURRENT_TIMESTAMP
             WHERE product_id = $2 AND branch_id = $3
             RETURNING id`,
            [item.quantity, item.product_id, sale.branch_id]
          );

          if (invUpdateRes.rows.length > 0) {
            await client.query(
              `INSERT INTO inventory_movements (inventory_id, user_id, type, quantity, reason)
               VALUES ($1, $2, 'devolucion', $3, $4)`,
              [invUpdateRes.rows[0].id, userId, item.quantity, `Anulación Venta #${id}: ${reason || 'Sin motivo'}`]
            );
          }
        }
      }

      if (sale.payment_method === 'cuenta_corriente') {
        const accountRes = await client.query('SELECT id FROM customer_accounts WHERE customer_id = $1', [sale.customer_id]);
        if (accountRes.rows.length > 0) {
          const accountId = accountRes.rows[0].id;
          await client.query(
            `UPDATE customer_accounts
             SET current_balance = current_balance - $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [sale.total, accountId]
          );

          await client.query(
            `INSERT INTO account_movements (account_id, sale_id, type, amount, description)
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
