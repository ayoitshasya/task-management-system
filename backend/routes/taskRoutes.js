// taskRoutes.js - All task and notification routes (all protected by JWT)
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getNotifications,
  markNotificationRead
} = require('../controllers/taskController');

// Validation rules for creating a task
const taskCreateValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('due_date').notEmpty().withMessage('Due date is required').isDate().withMessage('Due date must be a valid date')
];

// All routes require authentication
router.use(authMiddleware);

// Notification routes (placed before /:id so they don't conflict)
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// Task CRUD routes
router.get('/', getTasks);
router.post('/', taskCreateValidation, createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
