import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import AIAutopilot from './pages/AIAutopilot';
import SmartSchedule from './pages/SmartSchedule';
import Navbar from './components/Navbar';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={
            <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
          } />
          <Route path="/tasks" element={
            <PrivateRoute><Layout><Tasks /></Layout></PrivateRoute>
          } />
          <Route path="/reports" element={
            <PrivateRoute><Layout><Reports /></Layout></PrivateRoute>
          } />
          <Route path="/autopilot" element={
            <PrivateRoute><Layout><AIAutopilot /></Layout></PrivateRoute>
          } />
          <Route path="/schedule" element={
            <PrivateRoute><Layout><SmartSchedule /></Layout></PrivateRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
