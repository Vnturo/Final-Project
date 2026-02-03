import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user } = useAuth();

  // 1. Check if user is logged in at all
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 2. Check if user is an Admin
  if (!user.isAdmin) {
    // Optional: You can alert them before redirecting
    // alert("Access Denied: Admins Only"); 
    return <Navigate to="/" replace />;
  }

  // 3. If they pass checks, let them see the page
  return <Outlet />;
}