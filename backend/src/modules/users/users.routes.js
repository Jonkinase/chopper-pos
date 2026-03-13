const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');

router.use(authMiddleware);

// Solo admin y encargado pueden gestionar usuarios
router.get('/', roleMiddleware(['admin', 'encargado']), usersController.getAll);
router.post('/', roleMiddleware(['admin', 'encargado']), usersController.create);
router.put('/:id', roleMiddleware(['admin', 'encargado']), usersController.update);
router.delete('/:id', roleMiddleware(['admin', 'encargado']), usersController.delete);
router.put('/:id/password', roleMiddleware(['admin', 'encargado']), usersController.changePassword);
router.get('/:id/access-logs', roleMiddleware(['admin', 'encargado']), usersController.getAccessLogs);

module.exports = router;
