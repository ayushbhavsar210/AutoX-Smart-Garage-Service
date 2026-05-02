const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Register CRUD API
 */

/**
 * @swagger
 * /registers:
 *   post:
 *     summary: Create new register
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dipali
 *               username:
 *                 type: string
 *                 example: Dipali004
 *               email:
 *                 type: string
 *                 example: dipali@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               phone:
 *                 type: string
 *                 example: 9876543210
 *               gender:
 *                 type: string
 *                 example: female
 *               emailOtp:
 *                 type: string
 *                 example: 1234
 *               address:
 *                 type: string
 *                 example: Surat
 *               pincode:
 *                 type: string
 *                 example: 395006
 *     responses:
 *       201:
 *         description: Register created
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized access
 *       404:
 *         description: Register not found
 *       500:
 *         description: Internal server error
 */
const registerValidators = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),

  body('username')
    .optional()
    .isLength({ min: 3 }).withMessage('Userame must be at least 3 characters'),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('phone')
    .optional()
    .isLength({ min: 10 }).withMessage('Phone must be at least 10 digits'),

  validate
];

router.post(
  '/registers',

  ...registerValidators,

  authController.createRegister
);

router.post(
  '/auth/register',

  ...registerValidators,

  authController.register
);

router.post(
  '/send-otp',

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),

  validate,
  authController.sendOtp
);

router.post(
  '/auth/login/send-otp',

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),

  validate,
  authController.sendOtp
);

router.post(
  '/verify-otp',

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),

  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 4, max: 6 }).withMessage('OTP must be 4 to 6 digits'),

  validate,
  authController.verifyOtp
);

router.post(
  '/auth/login/verify-otp',

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),

  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 4, max: 6 }).withMessage('OTP must be 4 to 6 digits'),

  validate,
  authController.verifyOtp
);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login user using username and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: Dipali004
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
const loginValidators = [
  body('username')
    .optional()
    .notEmpty().withMessage('Username is required'),

  body('email')
    .optional()
    .isEmail().withMessage('Valid email is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  body().custom((value) => {
    if (!value?.username && !value?.email) {
      throw new Error('Username or email is required');
    }
    return true;
  }),

  validate
];

router.post(
  "/login",

  ...loginValidators,

  authController.loginUser
);

router.post(
  "/auth/login",

  ...loginValidators,

  authController.login
);

router.post(
  '/auth/forgot-password',

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),

  validate,
  authController.forgotPassword
);

router.post(
  '/auth/reset-password',

  body('token')
    .notEmpty().withMessage('Reset token is required'),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required'),

  validate,
  authController.resetPassword
);

router.get('/auth/me', authMiddleware, authController.me);
router.put('/auth/me', authMiddleware, authController.updateMe);

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Generate new access token using refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: your_refresh_token_here
 *     responses:
 *       200:
 *         description: New access token generated
 *       401:
 *         description: Invalid refresh token
 *       500:
 *         description: Internal server error
 */
router.post(
  "/refresh-token",

  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required'),

  validate,
  authController.refreshToken
);

router.post(
  "/auth/refresh-token",

  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required'),

  validate,
  authController.refreshToken
);

module.exports = router;