// notificationService.js - Cron job that checks for overdue/due-today tasks
// and inserts notifications for assigned users
const cron = require('node-cron');
const db = require('../config/db');

// This function runs on a schedule to find tasks that are due today or overdue
const startNotificationCron = () => {
  // Run every hour (cron syntax: minute hour day month weekday)
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running overdue task check...');

    try {
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

      // Find tasks that are due today or overdue and not yet completed
      const [tasks] = await db.query(
        `SELECT t.id, t.title, t.due_date, t.assigned_to
         FROM tasks t
         WHERE t.due_date <= ? AND t.status != 'Completed' AND t.assigned_to IS NOT NULL`,
        [today]
      );

      for (const task of tasks) {
        const isOverdue = task.due_date < today;
        const message = isOverdue
          ? `Task "${task.title}" is overdue (was due on ${task.due_date})`
          : `Task "${task.title}" is due today!`;

        // Insert notification for the assigned user
        await db.query(
          'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
          [task.assigned_to, message]
        );

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
