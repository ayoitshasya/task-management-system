const Groq = require('groq-sdk');
const Task = require('../models/Task');

let _groq = null;
const getGroq = () => {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
};

const callAI = async (prompt) => {
  const completion = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2048
  });
  return completion.choices[0].message.content;
};

const parseJSON = (text) => {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI returned invalid response. Try again.');
  return JSON.parse(match[0]);
};

// POST /api/ai/autopilot
const autopilot = async (req, res) => {
  const { title, description, context } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const prompt = `You are an expert project manager. Break down this complex task into actionable subtasks.

Task: "${title}"
${description ? `Description: "${description}"` : ''}
${context ? `Context: "${context}"` : ''}
Today's date: ${today}

Return ONLY a valid JSON object (no markdown, no explanation, just the JSON):
{
  "subtasks": [
    {
      "title": "specific subtask title",
      "description": "what needs to be done",
      "priority": "High",
      "estimated_hours": 2,
      "suggested_due_date": "YYYY-MM-DD",
      "rationale": "why this matters"
    }
  ],
  "total_estimated_hours": 10,
  "recommended_approach": "brief paragraph on best approach"
}

Rules:
- 3 to 7 subtasks
- Priority must be exactly: High, Medium, or Low
- Dates must be YYYY-MM-DD format starting from ${today}
- Order subtasks logically (dependencies first)`;

    const text = await callAI(prompt);
    const plan = parseJSON(text);
    res.json(plan);
  } catch (err) {
    console.error('AI autopilot error:', err);
    if (err.message?.includes('api_key') || err.status === 401) {
      return res.status(500).json({ message: 'Invalid Groq API key. Set GROQ_API_KEY in backend/.env' });
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

    const prompt = `You are a smart scheduling assistant. Analyze these tasks and suggest an optimized schedule.

Today: ${today.toISOString().split('T')[0]}
Active tasks: ${JSON.stringify(taskSummary, null, 2)}

Assume 6 productive hours available per day.

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "summary": "1-2 sentence overview of the scheduling situation",
  "productivity_tip": "one specific actionable tip for this workload",
  "overloaded_days": ["YYYY-MM-DD"],
  "rescheduled": [
    {
      "task_id": "exact id from input",
      "task_title": "task title",
      "old_due_date": "YYYY-MM-DD",
      "suggested_due_date": "YYYY-MM-DD",
      "reason": "brief reason"
    }
  ],
  "suggestions": [
    {
      "type": "overdue",
      "message": "actionable suggestion",
      "affected_tasks": ["task title"],
      "priority": "high"
    }
  ]
}

Rules:
- Only include overdue or genuinely overloaded tasks in rescheduled array
- suggested_due_date must be today or future (>= ${today.toISOString().split('T')[0]})
- type must be one of: overdue, overload, optimization
- priority must be: high, medium, or low`;

    const text = await callAI(prompt);
    const schedule = parseJSON(text);
    res.json(schedule);
  } catch (err) {
    console.error('Smart schedule error:', err);
    if (err.message?.includes('api_key') || err.status === 401) {
      return res.status(500).json({ message: 'Invalid Groq API key. Set GROQ_API_KEY in backend/.env' });
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
