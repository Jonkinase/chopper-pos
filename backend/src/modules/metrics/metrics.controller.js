const metricsService = require('./metrics.service');

class MetricsController {
  _validateBranch(req) {
    const { sucursal_id } = req.query;
    const user = req.user;

    if (user.role === 'admin') {
      return sucursal_id || 'all';
    } else {
      // Encargado solo su sucursal
      return user.branch_id;
    }
  }

  async getDashboard(req, res, next) {
    try {
      const sucursalId = this._validateBranch(req);
      const { periodo } = req.query;
      const data = await metricsService.getDashboard(sucursalId, periodo || 'hoy');
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getSales(req, res, next) {
    try {
      const sucursalId = this._validateBranch(req);
      const { fecha_desde, fecha_hasta } = req.query;
      const data = await metricsService.getSalesMetrics(sucursalId, fecha_desde || new Date(new Date().setDate(new Date().getDate() - 30)), fecha_hasta || new Date());
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getProducts(req, res, next) {
    try {
      const sucursalId = this._validateBranch(req);
      const { fecha_desde, fecha_hasta } = req.query;
      const data = await metricsService.getProductMetrics(sucursalId, fecha_desde || new Date(new Date().setDate(new Date().getDate() - 30)), fecha_hasta || new Date());
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getClients(req, res, next) {
    try {
      const sucursalId = this._validateBranch(req);
      const { fecha_desde, fecha_hasta } = req.query;
      const data = await metricsService.getClientMetrics(sucursalId, fecha_desde || new Date(new Date().setDate(new Date().getDate() - 30)), fecha_hasta || new Date());
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
