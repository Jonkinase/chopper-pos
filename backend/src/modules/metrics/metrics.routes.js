const express = require('express');
const router = express.Router();
const metricsController = require('./metrics.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin', 'encargado']));

router.get('/dashboard', metricsController.getDashboard.bind(metricsController));
router.get('/sales', metricsController.getSales.bind(metricsController));
router.get('/products', metricsController.getProducts.bind(metricsController));
router.get('/clients', metricsController.getClients.bind(metricsController));
router.get('/inventory', metricsController.getInventory.bind(metricsController));
router.get('/consolidated', roleMiddleware(['admin']), metricsController.getConsolidated.bind(metricsController));

module.exports = router;
