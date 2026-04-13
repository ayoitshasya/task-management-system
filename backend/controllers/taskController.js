// taskController.js - CRUD operations for tasks using Mongoose
const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// Helper: log an activity entry
const logActivity = async (userId, action) => {
  try {
    await ActivityLog.create({ user_id: userId, action });
  } catch (err) {
    console.error('Activity log error:', err);
  }
};

// Helper: format a task document for the frontend
// Adds assigned_to_name, created_by_name, and formats due_date as YYYY-MM-DD
const formatTask = (task) => ({
  ...task,
  id: task._id.toString(),
  assigned_to: task.assigned_to?._id?.toString() || null,
  assigned_to_name: task.assigned_to?.name || null,
  created_by: task.created_by?._id?.toString() || null,
  created_by_name: task.created_by?.name || null,
  due_date: task.due_date ? task.due_date.toISOString().split('T')[0] : null
});

// GET /api/tasks - Get tasks based on role
// Admin sees all tasks, regular user sees only their own
const getTasks = async (req, res) => {
  try {
    let query = {};

    if (req.user.role !== 'admin') {
      // Regular user: only tasks they created or are assigned to
      query = { $or: [{ assigned_to: req.user.id }, { created_by: req.user.id }] };
    }

    const tasks = await Task.find(query)
      .populate('assigned_to', 'name')
      .populate('created_by', 'name')
      .sort({ created_at: -1 })
      .lean();

    res.json(tasks.map(formatTask));
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
    const task = await Task.create({
      title,
      description,
      priority: priority || 'Medium',
      status: status || 'Pending',
      due_date: dueDate,
      assigned_to: assigned_to || null,
      created_by: req.user.id
    });

    // Log the create action
    await logActivity(req.user.id, `Created task: "${title}"`);

    res.status(201).json({ id: task._id.toString(), message: 'Task created successfully' });
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
    const existing = await Task.findById(id);
    if (!existing) {
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

    // Build update object with only the provided fields
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;
    if (due_date !== undefined) updates.due_date = new Date(due_date);
    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;

    await Task.findByIdAndUpdate(id, updates);
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
    const existing = await Task.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await Task.findByIdAndDelete(id);
    await logActivity(req.user.id, `Deleted task: "${existing.title}"`);

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ message: 'Server error deleting task' });
  }
};

// GET /api/tasks/notifications - Get unread notifications for logged in user
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.id, is_read: false })
      .sort({ created_at: -1 })
      .lean();

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
    await Notification.findOneAndUpdate(
      { _id: id, user_id: req.user.id },
      { is_read: true }
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark notification error:', err);
    res.status(500).json({ message: 'Server error updating notification' });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getNotifications, markNotificationRead };
