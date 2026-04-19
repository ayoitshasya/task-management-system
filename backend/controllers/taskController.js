const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action) => {
  try {
    await ActivityLog.create({ user_id: userId, action });
  } catch (err) {
    console.error('Activity log error:', err);
  }
};

// GET /api/tasks - Get tasks with pagination
const getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query;
    if (req.user.role === 'admin') {
      query = Task.find();
    } else {
      query = Task.find({
        $or: [{ assigned_to: req.user.id }, { created_by: req.user.id }]
      });
    }

    const [tasks, total] = await Promise.all([
      query.clone()
        .populate('assigned_to', 'name email')
        .populate('created_by', 'name email')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      query.clone().countDocuments()
    ]);

    const result = tasks.map(t => ({
      ...t.toObject(),
      id: t._id,
      assigned_to_name: t.assigned_to ? t.assigned_to.name : null,
      created_by_name: t.created_by ? t.created_by.name : null,
      assigned_to: t.assigned_to ? t.assigned_to._id : null,
      created_by: t.created_by ? t.created_by._id : null,
    }));

    res.json({
      tasks: result,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
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

  const { title, description, priority, status, due_date, assigned_to, estimated_hours, parent_task, is_subtask, ai_generated } = req.body;

  // Normalize due date to UTC midnight to avoid timezone drift
  const dueDate = new Date(due_date);
  dueDate.setUTCHours(0, 0, 0, 0);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

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
      created_by: req.user.id,
      estimated_hours: estimated_hours || null,
      parent_task: parent_task || null,
      is_subtask: is_subtask || false,
      ai_generated: ai_generated || false
    });

    await logActivity(req.user.id, `Created task: "${title}"`);

    res.status(201).json({ id: task._id, message: 'Task created successfully' });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ message: 'Server error creating task' });
  }
};

// PUT /api/tasks/:id - Update an existing task
const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status, due_date, assigned_to, estimated_hours, scheduled_start } = req.body;

  try {
    const existing = await Task.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role !== 'admin' && String(existing.created_by) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only edit tasks you created' });
    }

    // Non-admins cannot change assigned_to
    if (assigned_to !== undefined && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can reassign tasks' });
    }

    if (due_date) {
      const dueDate = new Date(due_date);
      dueDate.setUTCHours(0, 0, 0, 0);
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (dueDate < today) {
        return res.status(400).json({ message: 'Due date cannot be in the past' });
      }
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) {
      updates.status = status;
      if (status === 'Completed' && existing.status !== 'Completed') {
        updates.completed_at = new Date();
      }
    }
    if (due_date !== undefined) {
      const d = new Date(due_date);
      d.setUTCHours(0, 0, 0, 0);
      updates.due_date = d;
    }
    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
    if (estimated_hours !== undefined) updates.estimated_hours = estimated_hours;
    if (scheduled_start !== undefined) updates.scheduled_start = scheduled_start;

    await Task.findByIdAndUpdate(id, updates, { new: true });
    await logActivity(req.user.id, `Updated task ID: ${id}`);

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ message: 'Server error updating task' });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await Task.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role !== 'admin' && String(existing.created_by) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only delete tasks you created' });
    }

    const taskTitle = existing.title;
    await Task.findByIdAndDelete(id);
    await logActivity(req.user.id, `Deleted task: "${taskTitle}"`);

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ message: 'Server error deleting task' });
  }
};

// GET /api/tasks/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user_id: req.user.id,
      is_read: false
    }).sort({ created_at: -1 });

    const result = notifications.map(n => ({ ...n.toObject(), id: n._id }));
    res.json(result);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

// PUT /api/tasks/notifications/:id/read
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
