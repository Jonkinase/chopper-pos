const authService = require('./auth.service');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const data = await authService.login(email, password);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw { status: 400, message: 'Refresh token requerido' };
      const data = await authService.refreshToken(refreshToken);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      // En una implementación con Redis o DB para tokens invalidados se haría aquí.
      // Por ahora, el cliente simplemente descarta el token.
      res.json({ success: true, message: 'Sesión cerrada exitosamente' });
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      const data = await authService.getMe(req.user.user_id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
