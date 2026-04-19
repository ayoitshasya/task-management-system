import React, { useState } from 'react';
import api from '../api/axios';
import '../styles/SmartSchedule.css';

const PRIORITY_ICONS = { high: '🔴', medium: '🟡', low: '🟢' };
const TYPE_ICONS = { overdue: '⚠️', overload: '📦', optimization: '⚡' };

const SmartSchedule = () => {
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [selectedReschedules, setSelectedReschedules] = useState([]);

  const handleAnalyze = async () => {
    setError('');
    setLoading(true);
    setSchedule(null);
    setApplied(false);

    try {
      const res = await api.post('/ai/schedule');
      setSchedule(res.data);
      setSelectedReschedules(res.data.rescheduled?.map(r => r.task_id) || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze schedule. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const toggleReschedule = (taskId) => {
    setSelectedReschedules(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleApply = async () => {
    if (selectedReschedules.length === 0) {
      setError('Select at least one task to reschedule');
      return;
    }
    setApplying(true);
    try {
      const toApply = schedule.rescheduled.filter(r => selectedReschedules.includes(r.task_id));
      await api.post('/ai/schedule/apply', { rescheduled: toApply });
      setApplied(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply schedule');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h2>📅 Smart Scheduling</h2>
        <p className="schedule-subtitle">
          AI analyzes your tasks and suggests optimal scheduling to avoid overload and reschedule missed deadlines.
        </p>
      </div>

      {!schedule ? (
        <div className="schedule-intro card">
          <div className="intro-features">
            <div className="feature-item">
              <span className="feature-icon">🔄</span>
              <div>
                <strong>Auto-Reschedule</strong>
                <p>Overdue tasks get new realistic due dates</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚖️</span>
              <div>
                <strong>Workload Balance</strong>
                <p>Identifies days with too many tasks</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🧠</span>
              <div>
                <strong>Smart Optimization</strong>
                <p>Prioritization tips based on your workload</p>
              </div>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button className="btn-ai" onClick={handleAnalyze} disabled={loading}>
            {loading ? (
              <span className="loading-dots">Analyzing your schedule<span>.</span><span>.</span><span>.</span></span>
            ) : '🔍 Analyze My Schedule'}
          </button>
        </div>
      ) : (
        <div className="schedule-results">
          <div className="schedule-summary card">
            <div className="summary-top">
              <h3>Schedule Analysis</h3>
              <button className="btn-secondary" onClick={() => { setSchedule(null); setApplied(false); }}>
                Re-analyze
              </button>
            </div>
            <p className="summary-text">{schedule.summary}</p>

            {schedule.productivity_tip && (
              <div className="productivity-tip">
                <strong>💡 Productivity Tip</strong>
                <p>{schedule.productivity_tip}</p>
              </div>
            )}

            {schedule.overloaded_days?.length > 0 && (
              <div className="overloaded-days">
                <strong>⚠️ Overloaded Days:</strong>
                <div className="day-chips">
                  {schedule.overloaded_days.map(d => (
                    <span key={d} className="day-chip">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {schedule.suggestions?.length > 0 && (
            <div className="suggestions-section">
              <h3>Recommendations</h3>
              <div className="suggestions-list">
                {schedule.suggestions.map((s, i) => (
                  <div key={i} className={`suggestion-card card suggestion-${s.priority}`}>
                    <div className="suggestion-header">
                      <span className="suggestion-type">
                        {TYPE_ICONS[s.type] || '📌'} {s.type}
                      </span>
                      <span className={`suggestion-priority priority-${s.priority}`}>
                        {PRIORITY_ICONS[s.priority]} {s.priority}
                      </span>
                    </div>
                    <p className="suggestion-message">{s.message}</p>
                    {s.affected_tasks?.length > 0 && (
                      <div className="affected-tasks">
                        <span>Affects: </span>
                        {s.affected_tasks.map((t, j) => (
                          <span key={j} className="task-chip">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {schedule.rescheduled?.length > 0 && (
            <div className="reschedule-section">
              <div className="reschedule-header">
                <h3>Suggested Reschedules</h3>
                <span className="select-hint">Click to select tasks to reschedule</span>
              </div>

              <div className="reschedule-list">
                {schedule.rescheduled.map((r, i) => (
                  <div
                    key={i}
                    className={`reschedule-card card ${selectedReschedules.includes(r.task_id) ? 'selected' : ''}`}
                    onClick={() => toggleReschedule(r.task_id)}
                  >
                    <div className="reschedule-check">
                      {selectedReschedules.includes(r.task_id) ? '✓' : '○'}
                    </div>
                    <div className="reschedule-info">
                      <strong>{r.task_title}</strong>
                      <p className="reschedule-reason">{r.reason}</p>
                    </div>
                    <div className="reschedule-dates">
                      <span className="old-date">
                        <s>{r.old_due_date}</s>
                      </span>
                      <span className="arrow">→</span>
                      <span className="new-date">{r.suggested_due_date}</span>
                    </div>
                  </div>
                ))}
              </div>

              {error && <div className="error-msg">{error}</div>}

              {applied ? (
                <div className="success-banner">
                  ✅ Rescheduled {selectedReschedules.length} tasks! Check your task list.
                  <button className="btn-link" onClick={() => { setSchedule(null); setApplied(false); }}>
                    Analyze again
                  </button>
                </div>
              ) : (
                <button
                  className="btn-ai save-btn"
                  onClick={handleApply}
                  disabled={applying || selectedReschedules.length === 0}
                >
                  {applying ? 'Applying...' : `📅 Apply ${selectedReschedules.length} Reschedule${selectedReschedules.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          )}

          {(!schedule.rescheduled || schedule.rescheduled.length === 0) && !applied && (
            <div className="no-reschedule card">
              <p>✅ No rescheduling needed — your timeline looks good!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSchedule;
