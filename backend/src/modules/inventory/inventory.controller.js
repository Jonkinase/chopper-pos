const inventoryService = require('./inventory.service');

class InventoryController {
  async getByBranch(req, res, next) {
    try {
      const sucursalId = req.query.sucursal_id || req.user.branch_id;
      const data = await inventoryService.getByBranch(sucursalId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req, res, next) {
    try {
      const sucursalId = req.body.branch_id || req.user.branch_id;
      const data = await inventoryService.adjustStock(req.params.product_id, sucursalId, req.body, req.user.user_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getMovements(req, res, next) {
    try {
      const sucursalId = req.query.sucursal_id || req.user.branch_id;
      const data = await inventoryService.getMovements(req.params.product_id, sucursalId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new InventoryController();
