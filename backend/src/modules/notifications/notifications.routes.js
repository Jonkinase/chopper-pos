const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Todas las rutas de notificaciones requieren autenticación
router.use(authMiddleware);

router.get('/', notificationsController.getNotifications);
router.put('/read-all', notificationsController.markAllAsRead);
router.put('/:id/read', notificationsController.markAsRead);

module.exports = router;
