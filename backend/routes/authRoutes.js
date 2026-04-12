// authRoutes.js - Routes for registration, login, and user listing
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getUsers } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Validation rules for registration
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Validation rules for login
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected: only logged-in users can fetch the users list (for assignee dropdown)
router.get('/users', authMiddleware, getUsers);

module.exports = router;
