const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');
const sucursalMiddleware = require('../../middleware/sucursal.middleware');

router.use(authMiddleware);

router.get('/', productsController.getAll);
router.get('/export/pdf', productsController.exportPdf);
router.get('/:id', productsController.getById);

// Solo admin y encargado pueden gestionar productos
router.post('/', roleMiddleware(['admin', 'encargado']), sucursalMiddleware, productsController.create);
router.put('/:id', roleMiddleware(['admin', 'encargado']), sucursalMiddleware, productsController.update);
router.delete('/:id', roleMiddleware(['admin', 'encargado']), sucursalMiddleware, productsController.delete);

module.exports = router;
