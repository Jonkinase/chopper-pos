const productsService = require('./products.service');

class ProductsController {
  async getAll(req, res, next) {
    try {
      const sucursalId = req.query.sucursal_id || req.user.branch_id;
      const data = await productsService.getAll(sucursalId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await productsService.create(req.body, req.user.user_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await productsService.update(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await productsService.delete(req.params.id);
      res.json({ success: true, message: 'Producto eliminado correctamente' });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const sucursalId = req.query.sucursal_id || req.user.branch_id;
      const data = await productsService.getById(req.params.id, sucursalId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductsController();
