const branchesService = require('./branches.service');

class BranchesController {
  async getAll(req, res, next) {
    try {
      const data = await branchesService.getAll();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await branchesService.create(req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await branchesService.update(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await branchesService.delete(req.params.id);
      res.json({ success: true, message: 'Sucursal eliminada correctamente' });
    } catch (err) {
      next(err);
    }
  }

  async getStats(req, res, next) {
    try {
      const data = await branchesService.getStats(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BranchesController();
