import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user } = useAuth();

  // Check if user is logged in at all
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if user is an Admin
  if (!user.isAdmin) {
    // alert("Access Denied: Admins Only"); 
    return <Navigate to="/" replace />;
  }

  // If they pass checks, let them see the page
  return <Outlet />;
}