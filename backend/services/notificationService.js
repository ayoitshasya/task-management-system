// notificationService.js - Cron job that checks for overdue/due-today tasks
// and inserts notifications for assigned users
const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// This function runs on a schedule to find tasks that are due today or overdue
const startNotificationCron = () => {
  // Run every hour (cron syntax: minute hour day month weekday)
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running overdue task check...');

    try {
      // End of today — tasks due any time today or earlier count
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const todayStr = new Date().toISOString().split('T')[0];

      // Find tasks that are due today or overdue and not yet completed
      const tasks = await Task.find({
        due_date: { $lte: endOfToday },
        status: { $ne: 'Completed' },
        assigned_to: { $ne: null }
      }).lean();

      for (const task of tasks) {
        const dueDateStr = task.due_date.toISOString().split('T')[0];
        const isOverdue = dueDateStr < todayStr;

        const message = isOverdue
          ? `Task "${task.title}" is overdue (was due on ${dueDateStr})`
          : `Task "${task.title}" is due today!`;

        // Insert notification for the assigned user
        await Notification.create({ user_id: task.assigned_to, message });

        // In production this would send an actual email via nodemailer/SMTP
        // For now, just log to console
        console.log(`[Notification] User ${task.assigned_to}: ${message}`);
      }

      console.log(`[Cron] Done. Created ${tasks.length} notifications.`);
    } catch (err) {
      console.error('[Cron] Error during notification check:', err);
    }
  });

  console.log('[Cron] Notification service started — runs every hour');
};

module.exports = { startNotificationCron };
