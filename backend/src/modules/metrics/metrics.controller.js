const metricsService = require('./metrics.service');

class MetricsController {
  _validateBranch(req) {
    const { sucursal_id } = req.query;
    const user = req.user;

    if (user.role === 'admin') {
      return sucursal_id || 'all';
    }

    return user.branch_id;
  }

  _getRange(req, defaultPeriod = 'mes') {
    const { periodo, fecha_desde, fecha_hasta } = req.query;
    return {
      period: periodo || defaultPeriod,
      from: fecha_desde,
      to: fecha_hasta
    };
  }

  async getDashboard(req, res, next) {
    try {
      const sucursalId = this._validateBranch(req);
      const data = await metricsService.getDashboard(sucursalId, this._getRange(req, 'hoy'));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getSales(req, res, next) {
    try {
      const sucursalId = this._validateBranch(req);
      const range = metricsService.resolveDateRange(this._getRange(req));
      const data = await metricsService.getSalesMetrics(sucursalId, range.start, range.now);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getProducts(req, res, next) {
    try {
      const sucursalId = this._validateBranch(req);
      const range = metricsService.resolveDateRange(this._getRange(req));
      const data = await metricsService.getProductMetrics(sucursalId, range.start, range.now);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getClients(req, res, next) {
    try {
      const sucursalId = this._validateBranch(req);
      const range = metricsService.resolveDateRange(this._getRange(req));
      const data = await metricsService.getClientMetrics(sucursalId, range.start, range.now);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getInventory(req, res, next) {
    try {
      const sucursalId = this._validateBranch(req);
      const data = await metricsService.getInventoryMetrics(sucursalId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getConsolidated(req, res, next) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Acceso denegado: Solo administradores' });
      }
      const data = await metricsService.getConsolidated();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MetricsController();
