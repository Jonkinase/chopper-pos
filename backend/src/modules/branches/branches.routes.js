const express = require('express');
const router = express.Router();
const branchesController = require('./branches.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');

router.use(authMiddleware);

// Solo admin puede gestionar sucursales globalmente
router.get('/', roleMiddleware(['admin']), branchesController.getAll);
router.post('/', roleMiddleware(['admin']), branchesController.create);
router.put('/:id', roleMiddleware(['admin']), branchesController.update);
router.delete('/:id', roleMiddleware(['admin']), branchesController.delete);
router.get('/:id/stats', roleMiddleware(['admin']), branchesController.getStats);

module.exports = router;
