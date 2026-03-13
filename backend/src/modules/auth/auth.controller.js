const authService = require('./auth.service');
const usersService = require('../users/users.service');
const UAParser = require('ua-parser-js');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const data = await authService.login(email, password);

      // Registrar login
      try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
        const parser = new UAParser(req.headers['user-agent']);
        const result = parser.getResult();
        const deviceInfo = `${result.browser.name || 'Desconocido'} ${result.browser.version || ''} / ${result.os.name || 'OS Desconocido'}`;
        
        await usersService.recordAccessLog(data.user.id, 'login', ip, deviceInfo);
      } catch (logErr) {
        console.error('Error al registrar log de acceso:', logErr);
      }

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
      // Registrar logout si hay token
      if (req.user && req.user.user_id) {
        try {
          const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
          const parser = new UAParser(req.headers['user-agent']);
          const result = parser.getResult();
          const deviceInfo = `${result.browser.name || 'Desconocido'} ${result.browser.version || ''} / ${result.os.name || 'OS Desconocido'}`;
          
          await usersService.recordAccessLog(req.user.user_id, 'logout', ip, deviceInfo);
        } catch (logErr) {
          console.error('Error al registrar log de logout:', logErr);
        }
      }

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
