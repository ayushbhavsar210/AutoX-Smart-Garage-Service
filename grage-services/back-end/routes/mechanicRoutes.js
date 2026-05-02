const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const mechanicController = require('../controllers/mechanicController');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Mechanics
 *   description: Mechanic management APIs
 */

/**
 * @swagger
 * /api/mechanics:
 *   get:
 *     summary: List mechanics
 *     tags: [Mechanics]
 *     responses:
 *       200:
 *         description: Mechanics list
 */
router.get('/api/mechanics', mechanicController.listMechanics);

/**
 * @swagger
 * /api/mechanics:
 *   post:
 *     summary: Create mechanic
 *     tags: [Mechanics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, expertise, phone]
 *             properties:
 *               name:
 *                 type: string
 *               expertise:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mechanic created
 */
router.post(
  '/api/mechanics',
  body('name').notEmpty().withMessage('name is required'),
  body('expertise').notEmpty().withMessage('expertise is required'),
  body('phone').notEmpty().withMessage('phone is required'),
  validate,
  mechanicController.createMechanic
);

/**
 * @swagger
 * /api/mechanics/{id}:
 *   put:
 *     summary: Update mechanic
 *     tags: [Mechanics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               expertise:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mechanic updated
 */
router.put(
  '/api/mechanics/:id',
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  mechanicController.updateMechanic
);

module.exports = router;
