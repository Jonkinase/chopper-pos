const express = require('express');
const router = express.Router();
const inventoryController = require('./inventory.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');
const sucursalMiddleware = require('../../middleware/sucursal.middleware');

router.use(authMiddleware);

router.get('/', inventoryController.getByBranch);
router.get('/:product_id/movements', inventoryController.getMovements);

// Solo admin y encargado pueden ajustar inventario
router.put('/:product_id/adjust', roleMiddleware(['admin', 'encargado']), sucursalMiddleware, inventoryController.adjustStock);

module.exports = router;
