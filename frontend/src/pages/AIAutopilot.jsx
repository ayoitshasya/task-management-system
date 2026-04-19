import React, { useState } from 'react';
import api from '../api/axios';
import '../styles/AIAutopilot.css';

const PRIORITY_COLORS = { High: '#e74c3c', Medium: '#f39c12', Low: '#27ae60' };

const AIAutopilot = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState([]);

  const handleGenerate = async () => {
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }
    setError('');
    setLoading(true);
    setPlan(null);
    setSaved(false);

    try {
      const res = await api.post('/ai/autopilot', { title, description, context });
      setPlan(res.data);
      setSelected(res.data.subtasks.map((_, i) => i));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate plan. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (i) => {
    setSelected(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      setError('Select at least one subtask to save');
      return;
    }
    setSaving(true);
    try {
      const subtasksToSave = plan.subtasks.filter((_, i) => selected.includes(i));
      await api.post('/ai/autopilot/save', {
        parentTitle: title,
        subtasks: subtasksToSave
      });
      setSaved(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save tasks');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setContext('');
    setPlan(null);
    setSaved(false);
    setError('');
    setSelected([]);
  };

  return (
    <div className="autopilot-page">
      <div className="autopilot-header">
        <h2>🤖 AI Task Autopilot</h2>
        <p className="autopilot-subtitle">
          Describe a big goal and AI will break it into actionable subtasks with time estimates and priorities.
        </p>
      </div>

      {!plan ? (
        <div className="autopilot-form card">
          <div className="form-group">
            <label>What do you need to accomplish?</label>
            <input
              type="text"
              className="form-input"
              placeholder='e.g. "Build a portfolio website", "Prepare for final exams"'
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            />
          </div>

          <div className="form-group">
            <label>Description <span className="optional">(optional)</span></label>
            <textarea
              className="form-input"
              placeholder="Add any details about the goal..."
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Context / Deadline <span className="optional">(optional)</span></label>
            <input
              type="text"
              className="form-input"
              placeholder='e.g. "Due in 2 weeks", "For a job interview", "Academic project"'
              value={context}
              onChange={e => setContext(e.target.value)}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            className="btn-ai"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-dots">Analyzing<span>.</span><span>.</span><span>.</span></span>
            ) : '✨ Generate Plan'}
          </button>
        </div>
      ) : (
        <div className="plan-results">
          <div className="plan-summary card">
            <div className="plan-summary-header">
              <div>
                <h3>"{title}"</h3>
                <p className="plan-meta">
                  {plan.subtasks.length} subtasks · ~{plan.total_estimated_hours}h total
                </p>
              </div>
              <button className="btn-secondary" onClick={handleReset}>Start Over</button>
            </div>
            {plan.recommended_approach && (
              <div className="approach-box">
                <strong>💡 Recommended Approach</strong>
                <p>{plan.recommended_approach}</p>
              </div>
            )}
          </div>

          <div className="subtasks-section">
            <div className="subtasks-header">
              <h3>Subtasks</h3>
              <span className="select-hint">Click to select tasks to save</span>
            </div>

            <div className="subtasks-list">
              {plan.subtasks.map((st, i) => (
                <div
                  key={i}
                  className={`subtask-card card ${selected.includes(i) ? 'selected' : ''}`}
                  onClick={() => toggleSelect(i)}
                >
                  <div className="subtask-card-header">
                    <div className="subtask-check">
                      {selected.includes(i) ? '✓' : '○'}
                    </div>
                    <div className="subtask-info">
                      <h4>{st.title}</h4>
                      <p>{st.description}</p>
                    </div>
                    <div className="subtask-meta">
                      <span
                        className="priority-badge"
                        style={{ backgroundColor: PRIORITY_COLORS[st.priority] }}
                      >
                        {st.priority}
                      </span>
                      <span className="estimate-badge">⏱ {st.estimated_hours}h</span>
                    </div>
                  </div>
                  <div className="subtask-footer">
                    <span className="due-suggestion">📅 By {st.suggested_due_date}</span>
                    {st.rationale && (
                      <span className="rationale">💬 {st.rationale}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {error && <div className="error-msg">{error}</div>}

            {saved ? (
              <div className="success-banner">
                ✅ {selected.length} tasks saved to your task list!
                <button className="btn-link" onClick={handleReset}>Create another plan</button>
              </div>
            ) : (
              <button
                className="btn-ai save-btn"
                onClick={handleSave}
                disabled={saving || selected.length === 0}
              >
                {saving ? 'Saving...' : `💾 Save ${selected.length} Selected Task${selected.length !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAutopilot;
