const db = require('../../config/db');

class MetricsService {
  _startOfDay(date) {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  _endOfDay(date) {
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value;
  }

  _startOfWeek(date) {
    const value = this._startOfDay(date);
    const day = value.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    value.setDate(value.getDate() + diff);
    return value;
  }

  _startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  _startOfYear(date) {
    return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
  }

  _parseDateInput(value, endOfDay = false) {
    if (!value) return null;

    const date = value instanceof Date
      ? new Date(value)
      : new Date(typeof value === 'string' && value.length === 10 ? `${value}T00:00:00` : value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return endOfDay ? this._endOfDay(date) : this._startOfDay(date);
  }

  _buildPreviousRange(start, end) {
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { prevStart, prevEnd };
  }

  _buildComparablePreviousPeriod(start, end, unit) {
    const prevStart = new Date(start);
    const prevEnd = new Date(end);

    if (unit === 'week') {
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd.setDate(prevEnd.getDate() - 7);
    }

    if (unit === 'month') {
      prevStart.setMonth(prevStart.getMonth() - 1);
      prevEnd.setMonth(prevEnd.getMonth() - 1);
    }

    if (unit === 'year') {
      prevStart.setFullYear(prevStart.getFullYear() - 1);
      prevEnd.setFullYear(prevEnd.getFullYear() - 1);
    }

    return { prevStart, prevEnd };
  }

  getPeriodDates(period) {
    const now = new Date();
    let start;
    let previousRange;

    switch (period) {
      case 'hoy':
        start = this._startOfDay(now);
        previousRange = {
          prevStart: this._startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)),
          prevEnd: this._endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
        };
        break;
      case 'semana':
        start = this._startOfWeek(now);
        previousRange = this._buildComparablePreviousPeriod(start, now, 'week');
        break;
      case 'mes':
        start = this._startOfMonth(now);
        previousRange = this._buildComparablePreviousPeriod(start, now, 'month');
        break;
      case 'año':
        start = this._startOfYear(now);
        previousRange = this._buildComparablePreviousPeriod(start, now, 'year');
        break;
      default:
        start = this._startOfDay(now);
        previousRange = {
          prevStart: this._startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)),
          prevEnd: this._endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
        };
    }

    return { start, now, ...previousRange };
  }

  resolveDateRange({ period, from, to }) {
    if (from && to) {
      const start = this._parseDateInput(from);
      const end = this._parseDateInput(to, true);

      if (!start || !end) {
        throw new Error('Rango de fechas inválido');
      }

      if (start > end) {
        throw new Error('La fecha desde no puede ser mayor que la fecha hasta');
      }

      return { start, now: end, ...this._buildPreviousRange(start, end) };
    }

    return this.getPeriodDates(period || 'hoy');
  }

  async getDashboard(sucursalId, range) {
    const { start, now, prevStart, prevEnd } = this.resolveDateRange(range);
    const isAll = sucursalId === 'all';
    const branchFilter = isAll ? '' : 'AND s.branch_id = $3';
    const params = [start, now];
    if (!isAll) params.push(sucursalId);

    const currentStatsQuery = `
      SELECT 
        COALESCE(SUM(si.subtotal), 0) as total_amount, 
        COUNT(DISTINCT s.id) as total_count,
        COALESCE(SUM(si.subtotal - (si.quantity * COALESCE(p.cost, 0))), 0) as gross_profit
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}`;

    const prevParams = [prevStart, prevEnd];
    if (!isAll) prevParams.push(sucursalId);
    const prevStatsQuery = `
      SELECT 
        COALESCE(SUM(si.subtotal), 0) as total_amount
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}`;

    const lowStockQuery = `
      SELECT COUNT(*) FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.deleted_at IS NULL AND i.stock_actual <= 10 AND p.requires_stock = TRUE ${isAll ? '' : 'AND i.branch_id = $1'}`;

    const accountsBalanceQuery = `
      SELECT COALESCE(SUM(ca.current_balance), 0) as total_debt
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
    const currentTotal = parseFloat(current.total_amount);
    const currentCount = parseInt(current.total_count);
    const currentProfit = parseFloat(current.gross_profit);
    const prevAmount = parseFloat(prevRes.rows[0].total_amount);
    const variation = prevAmount === 0
      ? (currentTotal === 0 ? 0 : 100)
      : ((currentTotal - prevAmount) / prevAmount) * 100;

    return {
      total_sales: currentTotal,
      total_count: currentCount,
      gross_profit: currentProfit,
      margin_pct: currentTotal > 0 ? (currentProfit / currentTotal) * 100 : 0,
      ticket_promedio: currentCount > 0 ? currentTotal / currentCount : 0,
      variation_pct: variation,
      low_stock_count: parseInt(lowStockRes.rows[0].count),
      total_debt: parseFloat(balanceRes.rows[0].total_debt),
      new_clients: parseInt(newClientsRes.rows[0].count)
    };
  }

  async getSalesMetrics(sucursalId, fechaDesde, fechaHasta) {
    const isAll = sucursalId === 'all';
    const branchFilter = isAll ? '' : 'AND s.branch_id = $3';
    const params = [fechaDesde, fechaHasta];
    if (!isAll) params.push(sucursalId);

    const byDayQuery = `
      SELECT DATE(s.created_at) as label, SUM(s.total) as value
      FROM sales s
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}
      GROUP BY DATE(s.created_at)
      ORDER BY DATE(s.created_at) ASC`;

    const byHourQuery = `
      SELECT EXTRACT(HOUR FROM s.created_at) as label, COUNT(*) as value
      FROM sales s
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}
      GROUP BY label
      ORDER BY label ASC`;

    const byPaymentQuery = `
      SELECT payment_method as label, SUM(total) as value
      FROM sales s
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}
      GROUP BY payment_method`;

    const byDay = await db.query(byDayQuery, params);
    const byHour = await db.query(byHourQuery, params);
    const byPayment = await db.query(byPaymentQuery, params);

    return {
      sales_by_day: byDay.rows.map((r) => ({ ...r, value: parseFloat(r.value) })),
      sales_by_hour: byHour.rows.map((r) => ({ ...r, value: parseInt(r.value) })),
      sales_by_payment: byPayment.rows.map((r) => ({ ...r, value: parseFloat(r.value) }))
    };
  }

  async getProductMetrics(sucursalId, fechaDesde, fechaHasta) {
    const isAll = sucursalId === 'all';
    const branchFilter = isAll ? '' : 'AND s.branch_id = $3';
    const params = [fechaDesde, fechaHasta];
    if (!isAll) params.push(sucursalId);

    const topByAmountQuery = `
      SELECT p.name as label, SUM(si.subtotal) as value
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}
      GROUP BY p.name
      ORDER BY value DESC
      LIMIT 10`;

    const topByProfitQuery = `
      SELECT p.name as label, SUM(si.subtotal - (si.quantity * p.cost)) as value
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${branchFilter}
      GROUP BY p.name
      ORDER BY value DESC
      LIMIT 10`;

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

    const topClientsParams = [fechaDesde, fechaHasta];
    let topClientsBranchFilter = '';
    if (!isAll) {
      topClientsParams.push(sucursalId);
      topClientsBranchFilter = 'AND s.branch_id = $3';
    }

    const topClientsQuery = `
      SELECT c.name as label, SUM(s.total) as value
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.created_at >= $1 AND s.created_at <= $2 AND s.status = 'completada' ${topClientsBranchFilter}
      GROUP BY c.name
      ORDER BY value DESC
      LIMIT 10`;

    const topDebtParams = [];
    let topDebtBranchFilter = '';
    if (!isAll) {
      topDebtParams.push(sucursalId);
      topDebtBranchFilter = 'AND c.branch_id = $1';
    }

    const topDebtQuery = `
      SELECT c.name as label, ca.current_balance as value
      FROM customer_accounts ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE ca.current_balance > 0 ${topDebtBranchFilter}
      ORDER BY value DESC
      LIMIT 10`;

    const topClients = await db.query(topClientsQuery, topClientsParams);
    const topDebt = await db.query(topDebtQuery, topDebtParams);

    return {
      top_clients_spending: topClients.rows.map((r) => ({ ...r, value: parseFloat(r.value) })),
      top_clients_debt: topDebt.rows.map((r) => ({ ...r, value: parseFloat(r.value) }))
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
      WHERE i.deleted_at IS NULL AND p.requires_stock = TRUE ${isAll ? '' : 'AND i.branch_id = $1'}
      GROUP BY b.name`;

    const lowStockQuery = `
      SELECT p.name, i.stock_actual, b.name as branch_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN branches b ON i.branch_id = b.id
      WHERE i.deleted_at IS NULL AND i.stock_actual <= 10 AND p.requires_stock = TRUE ${isAll ? '' : 'AND i.branch_id = $1'}
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
