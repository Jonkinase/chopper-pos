const usersService = require('./users.service');

class UsersController {
  async getAll(req, res, next) {
    try {
      const { role, branch_id } = req.user;
      const data = await usersService.getAll(role, branch_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await usersService.create(req.body, req.user.role, req.user.branch_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await usersService.update(req.params.id, req.body, req.user.role, req.user.branch_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await usersService.delete(req.params.id, req.user.role, req.user.branch_id);
      res.json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { password } = req.body;
      if (!password) throw { status: 400, message: 'Nueva contraseña es requerida' };
      await usersService.changePassword(req.params.id, password, req.user.role, req.user.branch_id);
      res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (err) {
      next(err);
    }
  }

  async getAccessLogs(req, res, next) {
    try {
      // Opcional: Validar que solo admin o encargado de la sucursal puedan ver esto
      const data = await usersService.getAccessLogs(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UsersController();
