const errorMiddleware = (err, req, res, next) => {
  console.error('[Error Middleware]:', err);

  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  const errors = err.errors || [];

  res.status(status).json({
    success: false,
    message,
    errors
  });
};

module.exports = errorMiddleware;
