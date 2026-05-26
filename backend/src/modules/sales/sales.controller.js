const salesService = require('./sales.service');

class SalesController {
  async getAll(req, res, next) {
    try {
      const filters = {
        sucursal_id: req.query.sucursal_id || req.user.branch_id,
        fecha_desde: req.query.fecha_desde,
        fecha_hasta: req.query.fecha_hasta,
        cliente_id: req.query.cliente_id,
        tipo_pago: req.query.tipo_pago,
        estado: req.query.estado,
        search: req.query.search,
      };
      const data = await salesService.getAll(filters);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await salesService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const saleData = req.body;
      if (req.user.role !== 'admin') {
        saleData.sucursal_id = req.user.branch_id;
      }
      const data = await salesService.create(saleData, req.user.user_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async retryBilling(req, res, next) {
    try {
      const data = await salesService.retryBilling(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async downloadInvoicePdf(req, res, next) {
    try {
      const buffer = await salesService.generateInvoicePdf(req.params.id);
      const filename = `Factura_${req.params.id.substring(0, 8)}.pdf`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const { reason } = req.body;
      await salesService.cancel(req.params.id, req.user.user_id, reason);
      res.json({ success: true, message: 'Venta anulada correctamente' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SalesController();
