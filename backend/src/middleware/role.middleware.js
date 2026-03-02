const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Permisos insuficientes'
      });
    }
    next();
  };
};

module.exports = checkRole;
