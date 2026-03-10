const clientsService = require('./clients.service');

class ClientsController {
  async getAll(req, res, next) {
    try {
      const branch_id = req.query.branch_id || req.user.branch_id;
      const { search } = req.query;
      const data = await clientsService.getAll(branch_id, search);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const branch_id = req.body.branch_id || req.user.branch_id;
      const data = await clientsService.create({ ...req.body, branch_id });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const branch_id = req.body.branch_id || req.user.branch_id;
      const data = await clientsService.update(req.params.id, req.body, branch_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const branch_id = req.query.branch_id || req.user.branch_id;
      const data = await clientsService.getById(req.params.id, branch_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ClientsController();
