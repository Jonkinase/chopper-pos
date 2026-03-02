const express = require('express');
const router = express.Router();
const quotesController = require('./quotes.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');

router.use(authMiddleware);

router.get('/', quotesController.getAll);
router.post('/', quotesController.create);

// Rutas específicas ANTES de las genéricas /:id
router.get('/:id/pdf', quotesController.generatePDF);
router.put('/:id/status', roleMiddleware(['admin', 'encargado']), quotesController.updateStatus);
router.post('/:id/convert-to-sale', roleMiddleware(['admin', 'encargado']), quotesController.convertToSale);

// Rutas genéricas
router.get('/:id', quotesController.getById);
router.put('/:id', quotesController.update);
router.delete('/:id', quotesController.delete);

module.exports = router;
