import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, Role } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, token, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#4f46e5', fontWeight: 600 }}>Loading Fundsroom ERP Portal...</div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>403 - Access Forbidden</h2>
        <p style={{ color: '#64748b' }}>
          Your current account role (<strong>{user.role}</strong>) does not have sufficient permissions to view this module.
        </p>
      </div>
    );
  }

  return <Outlet />;
};
