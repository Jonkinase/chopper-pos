const express = require('express');
const router = express.Router();
const salesController = require('./sales.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');

router.use(authMiddleware);

router.get('/', salesController.getAll);
router.get('/:id', salesController.getById);
router.get('/:id/invoice/pdf', salesController.downloadInvoicePdf);
router.post('/', salesController.create);
router.post('/:id/billing/retry', roleMiddleware(['admin', 'encargado']), salesController.retryBilling);
router.put('/:id/cancel', roleMiddleware(['admin', 'encargado']), salesController.cancel);

module.exports = router;
