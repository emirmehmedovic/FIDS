// PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth(); // Dodajte loading stanje

  if (loading) {
    return <div>Loading...</div>; // Dodajte loading indikator
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default PrivateRoute;