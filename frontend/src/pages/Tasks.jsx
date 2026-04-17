import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import TaskForm from '../components/TaskForm';
import TaskCard from '../components/TaskCard';
import '../styles/Tasks.css';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  // Re-apply filters whenever tasks or filter values change
  useEffect(() => {
    let result = [...tasks];
    if (statusFilter) result = result.filter(t => t.status === statusFilter);
    if (priorityFilter) result = result.filter(t => t.priority === priorityFilter);
    setFiltered(result);
  }, [tasks, statusFilter, priorityFilter]);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error('Fetch tasks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleFormSave = () => {
    // Refresh tasks after create/update
    fetchTasks();
    handleFormClose();
  };

  if (loading) return <div className="loading">Loading tasks...</div>;

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h2>Tasks</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + New Task
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Task table */}
      {filtered.length === 0 ? (
        <div className="no-tasks">No tasks found. Create one!</div>
      ) : (
        <div className="tasks-table-wrap">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  currentUser={user}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default Tasks;
