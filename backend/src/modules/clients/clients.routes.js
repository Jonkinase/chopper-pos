const express = require('express');
const router = express.Router();
const clientsController = require('./clients.controller');
const authMiddleware = require('../../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', clientsController.getAll);
router.post('/', clientsController.create);
router.get('/:id', clientsController.getById);
router.put('/:id', clientsController.update);

module.exports = router;
