import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import NotificationPanel from '../components/NotificationPanel';
import '../styles/Dashboard.css';

const POLL_INTERVAL = 60000; // poll notifications every 60s

const Dashboard = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchData();

    // Poll notifications every 60 seconds
    pollRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/tasks/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Notification poll error:', err);
    }
  };

  const fetchData = async () => {
    try {
      const [tasksRes, notifRes] = await Promise.all([
        api.get('/tasks?limit=200'),
        api.get('/tasks/notifications')
      ]);
      setTasks(tasksRes.data.tasks || tasksRes.data);
      setNotifications(notifRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/tasks/notifications/${id}/read`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'Pending').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const overdue = tasks.filter(t => {
    const due = new Date(t.due_date).toISOString().split('T')[0];
    return due < today && t.status !== 'Completed';
  }).length;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Welcome back, {user?.name}!</h2>
          <p className="subtitle">Here's an overview of your tasks</p>
        </div>

        <div className="notif-bell" onClick={() => setShowNotifications(!showNotifications)}>
          <span className="bell-icon">&#128276;</span>
          {notifications.length > 0 && (
            <span className="notif-badge">{notifications.length}</span>
          )}
        </div>
      </div>

      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onMarkRead={markRead}
          onClose={() => setShowNotifications(false)}
        />
      )}

      <div className="summary-cards">
        <div className="card card-total">
          <h3>{total}</h3>
          <p>Total Tasks</p>
        </div>
        <div className="card card-pending">
          <h3>{pending}</h3>
          <p>Pending</p>
        </div>
        <div className="card card-inprogress">
          <h3>{inProgress}</h3>
          <p>In Progress</p>
        </div>
        <div className="card card-completed">
          <h3>{completed}</h3>
          <p>Completed</p>
        </div>
        <div className="card card-overdue">
          <h3>{overdue}</h3>
          <p>Overdue</p>
        </div>
      </div>

      <div className="role-info">
        <p>Logged in as: <strong>{user?.role === 'admin' ? 'Administrator' : 'User'}</strong></p>
        {user?.role === 'admin' && <p className="admin-note">You can view and manage all tasks.</p>}
      </div>
    </div>
  );
};

export default Dashboard;
