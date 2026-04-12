// NotificationPanel.jsx - Dropdown panel showing unread notifications
import React from 'react';
import '../styles/NotificationPanel.css';

const NotificationPanel = ({ notifications, onMarkRead, onClose }) => {
  return (
    <div className="notif-panel">
      <div className="notif-panel-header">
        <h4>Notifications</h4>
        <button className="notif-close" onClick={onClose}>&#x2715;</button>
      </div>

      {notifications.length === 0 ? (
        <p className="notif-empty">No unread notifications</p>
      ) : (
        <ul className="notif-list">
          {notifications.map(n => (
            <li key={n.id} className="notif-item">
              <p className="notif-message">{n.message}</p>
              <div className="notif-footer">
                <span className="notif-time">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
                <button
                  className="notif-mark-read"
                  onClick={() => onMarkRead(n.id)}
                >
                  Mark as read
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationPanel;
