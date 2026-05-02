const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const validate = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  return authMiddleware(req, res, next);
};

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: User vehicles
 */

/**
 * @swagger
 * /vehicles:
 *   get:
 *     summary: List logged-in user's vehicles
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle list
 *       401:
 *         description: Unauthorized
 */
router.get('/vehicles', optionalAuthMiddleware, vehicleController.getVehicles);
router.get('/api/vehicles/me', optionalAuthMiddleware, vehicleController.getVehicles);
router.get('/api/vehicles', authMiddleware, adminMiddleware, vehicleController.getAllVehicles);
router.get('/api/get_vehicles.php', authMiddleware, adminMiddleware, vehicleController.getAllVehicles);
router.get('/vehicles/all', authMiddleware, vehicleController.getAllVehicles);
router.get('/api/vehicles/user/:userId', authMiddleware, adminMiddleware, vehicleController.getVehicles);

/**
 * @swagger
 * /vehicles:
 *   post:
 *     summary: Add a new car to the user's profile
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [make, model, year, plate]
 *             properties:
 *               make:
 *                 type: string
 *                 example: Honda
 *               model:
 *                 type: string
 *                 example: City
 *               year:
 *                 type: integer
 *                 example: 2022
 *               plate:
 *                 type: string
 *                 example: GJ01AB1234
 *     responses:
 *       201:
 *         description: Vehicle added
 *       400:
 *         description: Validation error
 */
router.post(
  '/vehicles',
  authMiddleware,
  body('vehicle_number').optional().notEmpty().withMessage('vehicle_number is required when provided'),
  body('plate').optional().notEmpty().withMessage('plate is required when provided'),
  validate,
  vehicleController.createVehicle
);

router.post(
  '/api/vehicles',
  authMiddleware,
  adminMiddleware,
  body('vehicle_number').optional().notEmpty().withMessage('vehicle_number is required when provided'),
  body('plate').optional().notEmpty().withMessage('plate is required when provided'),
  validate,
  vehicleController.createVehicleByAdmin
);

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     summary: Get a vehicle by ID
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vehicle details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 */
router.get(
  '/vehicles/:id',
  authMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  vehicleController.getVehicleById
);

router.get(
  '/api/vehicles/:id',
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  vehicleController.getVehicleById
);

/**
 * @swagger
 * /vehicles/{id}:
 *   put:
 *     summary: Update a vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               plate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vehicle updated
 *       400:
 *         description: Validation error
 */
router.put(
  '/vehicles/:id',
  authMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  body('vehicle_number').optional().notEmpty().withMessage('vehicle_number is required when provided'),
  body('plate').optional().notEmpty().withMessage('plate is required when provided'),
  validate,
  vehicleController.updateVehicle
);

router.put(
  '/api/vehicles/:id',
  authMiddleware,
  adminMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  body('vehicle_number').optional().notEmpty().withMessage('vehicle_number is required when provided'),
  body('plate').optional().notEmpty().withMessage('plate is required when provided'),
  validate,
  vehicleController.updateVehicle
);

/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     summary: Remove a car from the profile
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vehicle deleted
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/vehicles/:id',
  authMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  vehicleController.deleteVehicle
);

router.delete(
  '/api/vehicles/:id',
  authMiddleware,
  adminMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  vehicleController.deleteVehicle
);

module.exports = router;
