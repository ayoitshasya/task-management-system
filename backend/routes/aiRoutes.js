const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/authMiddleware');
const { autopilot, saveAutopilotTasks, smartSchedule, applySchedule } = require('../controllers/aiController');

// Limit AI calls to prevent API abuse
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many AI requests, please wait a minute' }
});

router.use(authMiddleware);
router.use(aiLimiter);

router.post('/autopilot', autopilot);
router.post('/autopilot/save', saveAutopilotTasks);
router.post('/schedule', smartSchedule);
router.post('/schedule/apply', applySchedule);

module.exports = router;
