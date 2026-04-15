import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the Context
const AuthContext = createContext(null);

// Create the Provider Component
export const AuthProvider = ({ children }) => {
  // Initialize user from LocalStorage so they stay logged in on refresh
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login Action
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Logout Action
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Check if user is Admin
  const isAdmin = user?.isAdmin === true;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook for easy access
export const useAuth = () => {
  return useContext(AuthContext);
};