// AuthContext.js - Provides authentication state to the entire app
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

// AuthProvider wraps the app and makes user/token available everywhere
export const AuthProvider = ({ children }) => {
  // Load user and token from localStorage so login persists on refresh
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  // Called after successful login or register
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwtToken);
  };

  // Clear everything on logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context in any component
export const useAuth = () => useContext(AuthContext);
