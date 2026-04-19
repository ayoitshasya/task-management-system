import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">Task Manager</div>

      <div className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Dashboard
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Tasks
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Reports
        </NavLink>
        <NavLink to="/autopilot" className={({ isActive }) => isActive ? 'nav-link active nav-ai' : 'nav-link nav-ai'}>
          🤖 Autopilot
        </NavLink>
        <NavLink to="/schedule" className={({ isActive }) => isActive ? 'nav-link active nav-ai' : 'nav-link nav-ai'}>
          📅 Schedule
        </NavLink>
      </div>

      <div className="navbar-user">
        <span className="user-name">{user?.name}</span>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
