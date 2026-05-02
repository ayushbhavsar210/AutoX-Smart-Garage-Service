const express = require('express');
const { param, body, query } = require('express-validator');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const validate = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use('/api/inventory', authMiddleware, adminMiddleware);

router.get('/api/inventory', inventoryController.listInventory);

router.post(
  '/api/inventory',
  body('name').notEmpty().withMessage('name is required'),
  body('stock').isInt({ gte: 0 }).withMessage('stock must be a non-negative integer'),
  validate,
  inventoryController.addPart
);

router.put(
  '/api/inventory/:id',
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  inventoryController.updatePart
);

router.delete(
  '/api/inventory/:id',
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  inventoryController.deletePart
);

router.get('/api/inventory/low-stock', inventoryController.getLowStockAlerts);

router.get('/api/inventory/stock-history', inventoryController.getStockHistory);

router.post(
  '/api/inventory/use',
  body('partId').isInt({ gt: 0 }).withMessage('partId must be a positive integer'),
  body('quantity').isInt({ gt: 0 }).withMessage('quantity must be a positive integer'),
  validate,
  inventoryController.usePartInService
);

router.get('/api/inventory/report', inventoryController.getInventoryReport);

router.post(
  '/api/inventory/orders',
  body('partId').isInt({ gt: 0 }).withMessage('partId must be a positive integer'),
  body('quantity').isInt({ gt: 0 }).withMessage('quantity must be a positive integer'),
  body('supplier').notEmpty().withMessage('supplier is required'),
  validate,
  inventoryController.createPartOrder
);

module.exports = router;
