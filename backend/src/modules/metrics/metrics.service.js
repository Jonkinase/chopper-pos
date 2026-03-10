const db = require('../../config/db');

class MetricsService {
  getPeriodDates(period) {
    const now = new Date();
    const start = new Date();
    const prevStart = new Date();
    const prevEnd = new Date();

    switch(period) {
      case 'hoy':
        start.setHours(0,0,0,0);
        prevStart.setDate(start.getDate() - 1);
        prevStart.setHours(0,0,0,0);
        prevEnd.setDate(start.getDate() - 1);
        prevEnd.setHours(23,59,59,999);
        break;
      case 'semana':
        start.setDate(now.getDate() - 7);
        prevStart.setDate(start.getDate() - 7);
        prevEnd.setDate(start.getDate());
        break;
      case 'mes':
        start.setMonth(now.getMonth() - 1);
        prevStart.setMonth(start.getMonth() - 1);
        prevEnd.setMonth(start.getMonth());
        break;
      case 'año':
        start.setFullYear(now.getFullYear() - 1);
        prevStart.setFullYear(start.getFullYear() - 1);
        prevEnd.setFullYear(start.getFullYear());
        break;
      default:
        start.setHours(0,0,0,0);
        prevStart.setDate(start.getDate() - 1);
        prevStart.setHours(0,0,0,0);
        prevEnd.setDate(start.getDate() - 1);
        prevEnd.setHours(23,59,59,999);
    }
    return { start, now, prevStart, prevEnd };
  }

  async getDashboard(sucursalId, period) {
    const { start, now, prevStart, prevEnd } = this.getPeriodDates(period);
    const isAll = sucursalId === 'all';
    const branchFilter = isAll ? '' : 'AND branch_id = $3';
    const params = [start, now];
    if (!isAll) params.push(sucursalId);

    // Current Period Sales & Profit
    const currentStatsQuery = `
      SELECT 
        COALESCE(SUM(si.subtotal), 0) as total_amount, 
        COUNT(DISTINCT s.id) as total_count,
        COALESCE(SUM(si.subtotal - (si.quantity * COALESCE(p.cost, 0))), 0) as gross_profit
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}`;
    
    // Previous Period Stats
    const prevParams = [prevStart, prevEnd];
    if (!isAll) prevParams.push(sucursalId);
    const prevStatsQuery = `
      SELECT 
        COALESCE(SUM(total), 0) as total_amount
      FROM sales
      WHERE created_at >= $1 AND created_at <= $2 AND status = 'completada' ${branchFilter}`;

    // Other Metrics
    const lowStockQuery = `
      SELECT COUNT(*) FROM inventory 
      WHERE deleted_at IS NULL AND stock_actual <= 10 ${isAll ? '' : 'AND branch_id = $1'}`;
    
    const accountsBalanceQuery = `
      SELECT COALESCE(SUM(ca.current_balance), 0) 
      FROM customer_accounts ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE ca.current_balance > 0 ${isAll ? '' : 'AND c.branch_id = $1'}`;

    const newClientsQuery = `
      SELECT COUNT(*) FROM customers 
      WHERE created_at >= $1 AND created_at <= $2 AND deleted_at IS NULL ${isAll ? '' : 'AND branch_id = $3'}`;

    const currentRes = await db.query(currentStatsQuery, params);
    const prevRes = await db.query(prevStatsQuery, prevParams);
    const lowStockRes = await db.query(lowStockQuery, isAll ? [] : [sucursalId]);
    const balanceRes = await db.query(accountsBalanceQuery, isAll ? [] : [sucursalId]);
    const newClientsRes = await db.query(newClientsQuery, isAll ? [start, now] : [start, now, sucursalId]);

    const current = currentRes.rows[0];
    const prevAmount = parseFloat(prevRes.rows[0].total_amount);
    const variation = prevAmount === 0 ? 100 : ((parseFloat(current.total_amount) - prevAmount) / prevAmount) * 100;

    return {
      total_sales: parseFloat(current.total_amount),
      total_count: parseInt(current.total_count),
      gross_profit: parseFloat(current.gross_profit),
      margin_pct: current.total_amount > 0 ? (parseFloat(current.gross_profit) / parseFloat(current.total_amount)) * 100 : 0,
      ticket_promedio: current.total_count > 0 ? parseFloat(current.total_amount) / parseInt(current.total_count) : 0,
      variation_pct: variation,
      low_stock_count: parseInt(lowStockRes.rows[0].count),
      total_debt: parseFloat(balanceRes.rows[0].sum),
      new_clients: parseInt(newClientsRes.rows[0].count)
    };
  }

  async getSalesMetrics(sucursalId, fechaDesde, fechaHasta) {
    const isAll = sucursalId === 'all';
    const branchFilter = isAll ? '' : 'AND s.branch_id = $3';
    const params = [fechaDesde, fechaHasta];
    if (!isAll) params.push(sucursalId);

    // Grouped by Day
    const byDayQuery = `
      SELECT DATE(s.created_at) as label, SUM(s.total) as value
      FROM sales s
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}
      GROUP BY DATE(s.created_at)
      ORDER BY DATE(s.created_at) ASC`;

    // Grouped by Hour
    const byHourQuery = `
      SELECT EXTRACT(HOUR FROM s.created_at) as label, COUNT(*) as value
      FROM sales s
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}
      GROUP BY label
      ORDER BY label ASC`;

    // By Payment Method
    const byPaymentQuery = `
      SELECT payment_method as label, SUM(total) as value
      FROM sales s
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}
      GROUP BY payment_method`;

    const byDay = await db.query(byDayQuery, params);
    const byHour = await db.query(byHourQuery, params);
    const byPayment = await db.query(byPaymentQuery, params);

    return {
      sales_by_day: byDay.rows.map(r => ({ ...r, value: parseFloat(r.value) })),
      sales_by_hour: byHour.rows.map(r => ({ ...r, value: parseInt(r.value) })),
      sales_by_payment: byPayment.rows.map(r => ({ ...r, value: parseFloat(r.value) }))
    };
  }

  async getProductMetrics(sucursalId, fechaDesde, fechaHasta) {
    const isAll = sucursalId === 'all';
    const branchFilter = isAll ? '' : 'AND s.branch_id = $3';
    const params = [fechaDesde, fechaHasta];
    if (!isAll) params.push(sucursalId);

    // Top 10 by Amount
    const topByAmountQuery = `
      SELECT p.name as label, SUM(si.subtotal) as value
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}
      GROUP BY p.name
      ORDER BY value DESC
      LIMIT 10`;

    // Top 10 by Profitability
    const topByProfitQuery = `
      SELECT p.name as label, SUM(si.subtotal - (si.quantity * p.cost)) as value
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}
      GROUP BY p.name
      ORDER BY value DESC
      LIMIT 10`;

    // By Type
    const byTypeQuery = `
      SELECT p.type as label, SUM(si.subtotal) as value
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}
      GROUP BY p.type`;

    const topAmount = await db.query(topByAmountQuery, params);
    const topProfit = await db.query(topByProfitQuery, params);
    const byType = await db.query(byTypeQuery, params);

    return {
      top_products_amount: topAmount.rows,
      top_products_profit: topProfit.rows,
      sales_by_type: byType.rows
    };
  }

  async getClientMetrics(sucursalId, fechaDesde, fechaHasta) {
    const isAll = sucursalId === 'all';
    const branchFilter = isAll ? '' : 'AND s.branch_id = $3';
    const params = [fechaDesde, fechaHasta];
    if (!isAll) params.push(sucursalId);

    const topClientsQuery = `
      SELECT c.name as label, SUM(s.total) as value
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}
      GROUP BY c.name
      ORDER BY value DESC
      LIMIT 10`;

    const topDebtQuery = `
      SELECT c.name as label, ca.current_balance as value
      FROM customer_accounts ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE ca.current_balance > 0 ${isAll ? '' : 'AND c.branch_id = $3'}
      ORDER BY value DESC
      LIMIT 10`;

    const topClients = await db.query(topClientsQuery, params);
    const topDebt = await db.query(topDebtQuery, params);

    return {
      top_clients_spending: topClients.rows,
      top_clients_debt: topDebt.rows
    };
  }

  async getInventoryMetrics(sucursalId) {
    const isAll = sucursalId === 'all';
    const params = isAll ? [] : [sucursalId];
    
    const valuationQuery = `
      SELECT b.name as label, SUM(i.stock_actual * p.cost) as value
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN branches b ON i.branch_id = b.id
      WHERE i.deleted_at IS NULL ${isAll ? '' : 'AND i.branch_id = $1'}
      GROUP BY b.name`;

    const lowStockQuery = `
      SELECT p.name, i.stock_actual, b.name as branch_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN branches b ON i.branch_id = b.id
      WHERE i.deleted_at IS NULL AND i.stock_actual <= 10 ${isAll ? '' : 'AND i.branch_id = $1'}
      ORDER BY b.name, p.name`;

    const valuation = await db.query(valuationQuery, params);
    const lowStock = await db.query(lowStockQuery, params);

    return {
      inventory_valuation: valuation.rows,
      low_stock_details: lowStock.rows
    };
  }

  async getConsolidated() {
    const branchComparisonQuery = `
      SELECT b.name as label, SUM(si.subtotal) as value, SUM(si.subtotal - (si.quantity * COALESCE(p.cost, 0))) as profit
      FROM sales s
      JOIN branches b ON s.branch_id = b.id
      JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE s.status = 'completada'
      GROUP BY b.name
      ORDER BY value DESC`;

    const globalStatsQuery = `
      SELECT 
        SUM(si.subtotal) as total_sales,
        SUM(si.subtotal - (si.quantity * COALESCE(p.cost, 0))) as total_profit
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE s.status = 'completada'`;

    const branchComparison = await db.query(branchComparisonQuery);
    const globalStats = await db.query(globalStatsQuery);

    return {
      branch_performance: branchComparison.rows,
      global_stats: {
        total_sales: parseFloat(globalStats.rows[0].total_sales),
        total_profit: parseFloat(globalStats.rows[0].total_profit),
        overall_margin: (parseFloat(globalStats.rows[0].total_profit) / parseFloat(globalStats.rows[0].total_sales)) * 100
      }
    };
  }
}

module.exports = new MetricsService();
