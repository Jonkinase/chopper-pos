const checkBranch = (req, res, next) => {
  // Si es admin, puede operar en cualquier sucursal
  if (req.user.role === 'admin') {
    return next();
  }

  // Si no es admin, verificar que el branch_id coincida o que el recurso pertenezca a su sucursal
  // Nota: Esto puede extenderse dependiendo de si el branch_id viene en params, body o query
  const requestedBranchId = req.params.branch_id || req.body.branch_id || req.query.branch_id;

  if (requestedBranchId && requestedBranchId !== req.user.branch_id) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: No tienes permiso para acceder a esta sucursal'
    });
  }

  // Forzamos el branch_id del usuario para operaciones de creación si no es admin
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!req.user.branch_id) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Usuario no asignado a una sucursal'
      });
    }
    // Si no es admin y está intentando crear algo en otra sucursal, lo prevenimos
    // O simplemente sobreescribimos con su sucursal para mayor seguridad
    if (req.body.branch_id && req.body.branch_id !== req.user.branch_id) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado: No puedes operar en una sucursal distinta a la asignada'
        });
    }
  }

  next();
};

module.exports = checkBranch;
