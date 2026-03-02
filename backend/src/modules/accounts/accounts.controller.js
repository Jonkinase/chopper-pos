const accountsService = require('./accounts.service');

class AccountsController {
  async getAll(req, res, next) {
    try {
      const sucursalId = req.query.sucursal_id || req.user.branch_id;
      const data = await accountsService.getAll(sucursalId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getDetail(req, res, next) {
    try {
      const data = await accountsService.getDetail(req.params.cliente_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async registerPayment(req, res, next) {
    try {
      const data = await accountsService.registerPayment(req.params.cliente_id, req.body, req.user.user_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getMovements(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const data = await accountsService.getMovements(req.params.cliente_id, parseInt(limit), parseInt(offset));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AccountsController();
