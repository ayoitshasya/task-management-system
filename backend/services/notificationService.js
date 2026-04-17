// notificationService.js - Cron job that checks for overdue/due-today tasks
const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

const startNotificationCron = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running overdue task check...');

    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      // Find tasks that are due today or overdue and not yet completed
      const tasks = await Task.find({
        due_date: { $lte: today },
        status: { $ne: 'Completed' },
        assigned_to: { $ne: null }
      });

      for (const task of tasks) {
        const taskDate = new Date(task.due_date);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const isOverdue = taskDate < now;

        const message = isOverdue
          ? `Task "${task.title}" is overdue (was due on ${taskDate.toLocaleDateString()})`
          : `Task "${task.title}" is due today!`;

        // Only create notification if one with the same message doesn't already exist today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const alreadyNotified = await Notification.findOne({
          user_id: task.assigned_to,
          message,
          created_at: { $gte: startOfDay }
        });

        if (!alreadyNotified) {
          await Notification.create({
            user_id: task.assigned_to,
            message
          });
          // In production this would send an actual email via nodemailer/SMTP
          console.log(`[Notification] User ${task.assigned_to}: ${message}`);
        }
      }

      console.log(`[Cron] Done. Created ${tasks.length} notifications.`);
    } catch (err) {
      console.error('[Cron] Error during notification check:', err);
    }
  });

  console.log('[Cron] Notification service started — runs every hour');
};

module.exports = { startNotificationCron };
