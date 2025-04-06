// PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

// Updated to accept allowedRoles array instead of single requiredRole
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth(); 

  if (loading) {
    return <div>Loading...</div>; // Show loading indicator
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If allowedRoles is specified, check if the user's role is included
  // If allowedRoles is not specified, allow access for any authenticated user
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect if the role is not in the allowed list
    // Consider redirecting to a specific 'Unauthorized' page or back to dashboard
    return <Navigate to="/dashboard" />; 
  }

  // If user is logged in and has the required role (or no specific role is required), render the children
  return children;
};

export default PrivateRoute;
