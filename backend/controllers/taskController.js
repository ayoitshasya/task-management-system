// taskController.js - CRUD operations for tasks
const { validationResult } = require('express-validator');
const db = require('../config/db');

// Helper to log activity (used after create/update/delete)
const logActivity = async (userId, action) => {
  try {
    await db.query('INSERT INTO activity_log (user_id, action) VALUES (?, ?)', [userId, action]);
  } catch (err) {
    console.error('Activity log error:', err);
  }
};

// GET /api/tasks - Get tasks based on role
// Admin sees all tasks, regular user sees only their own tasks
const getTasks = async (req, res) => {
  try {
    let query;
    let params;

    if (req.user.role === 'admin') {
      // Admin gets all tasks with assignee and creator names
      query = `
        SELECT t.*,
               u1.name AS assigned_to_name,
               u2.name AS created_by_name
        FROM tasks t
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        ORDER BY t.created_at DESC
      `;
      params = [];
    } else {
      // Regular user sees tasks they created or are assigned to
      query = `
        SELECT t.*,
               u1.name AS assigned_to_name,
               u2.name AS created_by_name
        FROM tasks t
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        WHERE t.assigned_to = ? OR t.created_by = ?
        ORDER BY t.created_at DESC
      `;
      params = [req.user.id, req.user.id];
    }

    const [tasks] = await db.query(query, params);
    res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
};

// POST /api/tasks - Create a new task
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, priority, status, due_date, assigned_to } = req.body;

  // Reject if due date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(due_date);
  if (dueDate < today) {
    return res.status(400).json({ message: 'Due date cannot be in the past' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO tasks (title, description, priority, status, due_date, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, priority || 'Medium', status || 'Pending', due_date, assigned_to || null, req.user.id]
    );

    // Log the create action
    await logActivity(req.user.id, `Created task: "${title}"`);

    res.status(201).json({ id: result.insertId, message: 'Task created successfully' });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ message: 'Server error creating task' });
  }
};

// PUT /api/tasks/:id - Update an existing task
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status, due_date, assigned_to } = req.body;

  try {
    // Check task exists
    const [existing] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // If due_date is being changed, validate it's not in the past
    if (due_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(due_date);
      if (dueDate < today) {
        return res.status(400).json({ message: 'Due date cannot be in the past' });
      }
    }

    await db.query(
      `UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        due_date = COALESCE(?, due_date),
        assigned_to = COALESCE(?, assigned_to)
       WHERE id = ?`,
      [title, description, priority, status, due_date, assigned_to, id]
    );

    await logActivity(req.user.id, `Updated task ID: ${id}`);

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ message: 'Server error updating task' });
  }
};

// DELETE /api/tasks/:id - Delete a task
const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT title FROM tasks WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const taskTitle = existing[0].title;
    await db.query('DELETE FROM tasks WHERE id = ?', [id]);

    await logActivity(req.user.id, `Deleted task: "${taskTitle}"`);

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ message: 'Server error deleting task' });
  }
};

// GET /api/tasks/notifications - Get unread notifications for logged in user
const getNotifications = async (req, res) => {
  try {
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? AND is_read = FALSE ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

// PUT /api/tasks/notifications/:id/read - Mark a notification as read
const markNotificationRead = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark notification error:', err);
    res.status(500).json({ message: 'Server error updating notification' });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getNotifications, markNotificationRead };
