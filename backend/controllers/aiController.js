const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const callGemini = async (prompt) => {
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// POST /api/ai/autopilot
const autopilot = async (req, res) => {
  const { title, description, context } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const prompt = `You are an expert project manager. A user wants to break down a complex task into actionable subtasks.

Task: "${title}"
${description ? `Description: "${description}"` : ''}
${context ? `Additional context: "${context}"` : ''}
Today's date: ${today}

Break this into 3-7 concrete, actionable subtasks. For each subtask provide:
1. A clear, specific title
2. A brief description of what needs to be done
3. Priority (Low/Medium/High)
4. Estimated hours to complete (realistic estimate)
5. Suggested due date (YYYY-MM-DD format, starting from today, ordered logically)
6. Why this subtask matters

Respond ONLY with valid JSON, no markdown, no code blocks, just raw JSON:
{
  "subtasks": [
    {
      "title": "subtask title",
      "description": "what needs to be done",
      "priority": "High",
      "estimated_hours": 2,
      "suggested_due_date": "YYYY-MM-DD",
      "rationale": "why this matters"
    }
  ],
  "total_estimated_hours": 10,
  "recommended_approach": "Brief paragraph on best approach"
}`;

    const text = await callGemini(prompt);

    // Strip markdown code blocks if Gemini wraps in them
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ message: 'AI returned invalid response. Try again.' });
    }

    const plan = JSON.parse(jsonMatch[0]);
    res.json(plan);
  } catch (err) {
    console.error('AI autopilot error:', err);
    if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key')) {
      return res.status(500).json({ message: 'Invalid Gemini API key. Set GEMINI_API_KEY in backend/.env' });
    }
    res.status(500).json({ message: 'AI error: ' + err.message });
  }
};

// POST /api/ai/autopilot/save
const saveAutopilotTasks = async (req, res) => {
  const { parentTitle, subtasks } = req.body;

  if (!subtasks || !Array.isArray(subtasks) || subtasks.length === 0) {
    return res.status(400).json({ message: 'No subtasks provided' });
  }

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const lastDate = subtasks[subtasks.length - 1].suggested_due_date;
    const parentDue = lastDate
      ? new Date(lastDate)
      : new Date(Date.now() + 14 * 86400000);

    const parentTask = await Task.create({
      title: parentTitle,
      description: 'AI-generated parent task',
      priority: 'High',
      status: 'Pending',
      due_date: parentDue,
      created_by: req.user.id,
      ai_generated: true
    });

    const createdSubtasks = await Promise.all(
      subtasks.map(async (st) => {
        let dueDate = new Date(st.suggested_due_date);
        dueDate.setUTCHours(0, 0, 0, 0);
        if (dueDate < today) dueDate = new Date(today.getTime() + 86400000);

        return Task.create({
          title: st.title,
          description: st.description || '',
          priority: st.priority || 'Medium',
          status: 'Pending',
          due_date: dueDate,
          estimated_hours: st.estimated_hours || null,
          parent_task: parentTask._id,
          is_subtask: true,
          ai_generated: true,
          created_by: req.user.id
        });
      })
    );

    res.status(201).json({
      message: `Created ${createdSubtasks.length} subtasks`,
      parent_id: parentTask._id,
      subtask_ids: createdSubtasks.map(t => t._id)
    });
  } catch (err) {
    console.error('Save autopilot tasks error:', err);
    res.status(500).json({ message: 'Error saving tasks: ' + err.message });
  }
};

// POST /api/ai/schedule
const smartSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let taskQuery;
    if (req.user.role === 'admin') {
      taskQuery = Task.find({ status: { $ne: 'Completed' } });
    } else {
      taskQuery = Task.find({
        $or: [{ assigned_to: userId }, { created_by: userId }],
        status: { $ne: 'Completed' }
      });
    }

    const tasks = await taskQuery.sort({ due_date: 1 }).limit(50);

    if (tasks.length === 0) {
      return res.json({
        suggestions: [],
        summary: 'No active tasks to schedule.',
        overloaded_days: [],
        rescheduled: []
      });
    }

    const taskSummary = tasks.map(t => ({
      id: t._id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date.toISOString().split('T')[0],
      estimated_hours: t.estimated_hours || 2,
      is_overdue: t.due_date < today
    }));

    const prompt = `You are a smart scheduling assistant. Analyze these tasks and provide scheduling recommendations.

Today: ${today.toISOString().split('T')[0]}
Tasks: ${JSON.stringify(taskSummary, null, 2)}

Assume 6 productive hours/day. Identify overloaded days and suggest reschedules for overdue tasks.

Respond ONLY with valid JSON, no markdown, no code blocks:
{
  "summary": "Brief overview of the scheduling situation",
  "productivity_tip": "Actionable advice for this workload",
  "overloaded_days": ["YYYY-MM-DD"],
  "rescheduled": [
    {
      "task_id": "id string",
      "task_title": "title",
      "old_due_date": "YYYY-MM-DD",
      "suggested_due_date": "YYYY-MM-DD",
      "reason": "why rescheduled"
    }
  ],
  "suggestions": [
    {
      "type": "overdue",
      "message": "specific actionable suggestion",
      "affected_tasks": ["task title"],
      "priority": "high"
    }
  ]
}`;

    const text = await callGemini(prompt);
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ message: 'AI returned invalid response. Try again.' });
    }

    const schedule = JSON.parse(jsonMatch[0]);
    res.json(schedule);
  } catch (err) {
    console.error('Smart schedule error:', err);
    if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key')) {
      return res.status(500).json({ message: 'Invalid Gemini API key. Set GEMINI_API_KEY in backend/.env' });
    }
    res.status(500).json({ message: 'AI error: ' + err.message });
  }
};

// POST /api/ai/schedule/apply
const applySchedule = async (req, res) => {
  const { rescheduled } = req.body;

  if (!rescheduled || !Array.isArray(rescheduled) || rescheduled.length === 0) {
    return res.status(400).json({ message: 'No reschedule data provided' });
  }

  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const updates = await Promise.all(
      rescheduled.map(async (item) => {
        const task = await Task.findById(item.task_id);
        if (!task) return null;

        if (req.user.role !== 'admin' && String(task.created_by) !== String(req.user.id)) {
          return null;
        }

        const newDate = new Date(item.suggested_due_date);
        newDate.setUTCHours(0, 0, 0, 0);
        if (newDate < today) return null;

        await Task.findByIdAndUpdate(item.task_id, {
          due_date: newDate,
          original_due_date: task.original_due_date || task.due_date
        });

        return item.task_id;
      })
    );

    const applied = updates.filter(Boolean);
    res.json({ message: `Rescheduled ${applied.length} tasks`, updated_ids: applied });
  } catch (err) {
    console.error('Apply schedule error:', err);
    res.status(500).json({ message: 'Error applying schedule: ' + err.message });
  }
};

module.exports = { autopilot, saveAutopilotTasks, smartSchedule, applySchedule };
