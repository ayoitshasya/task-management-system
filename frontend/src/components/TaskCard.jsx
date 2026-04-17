// TaskCard.jsx - Renders a single task as a table row
import React from 'react';

// Returns the CSS class for the priority badge based on priority value
const getPriorityClass = (priority) => {
  if (priority === 'High') return 'badge badge-high';
  if (priority === 'Medium') return 'badge badge-medium';
  return 'badge badge-low';
};

const TaskCard = ({ task, onEdit, onDelete, currentUser }) => {
  // Format date to a readable format
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  // Check if task is overdue (past due date and not completed)
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.due_date < today && task.status !== 'Completed';

  return (
    <tr className={isOverdue ? 'row-overdue' : ''}>
      <td>{task.title}</td>
      <td>
        <span className={getPriorityClass(task.priority)}>
          {task.priority}
        </span>
      </td>
      <td>{task.status}</td>
      <td className={isOverdue ? 'overdue-date' : ''}>
        {formatDate(task.due_date)}
        {isOverdue && <span className="overdue-label"> (Overdue)</span>}
      </td>
      <td>{task.assigned_to_name || 'Unassigned'}</td>
      <td>
        {(currentUser?.role === 'admin' || String(task.created_by) === String(currentUser?.id)) && (
          <>
            <button className="btn-edit" onClick={() => onEdit(task)}>Edit</button>
            <button className="btn-delete" onClick={() => onDelete(task.id)}>Delete</button>
          </>
        )}
        {currentUser?.role !== 'admin' && String(task.created_by) !== String(currentUser?.id) && (
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>View only</span>
        )}
      </td>
    </tr>
  );
};

export default TaskCard;
