const express = require('express');
const router = express.Router();
const accountsController = require('./accounts.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');

router.use(authMiddleware);

router.get('/', accountsController.getAll);
router.get('/:cliente_id', accountsController.getDetail);
router.post('/:cliente_id/payment', accountsController.registerPayment);
router.get('/:cliente_id/movements', accountsController.getMovements);

module.exports = router;
