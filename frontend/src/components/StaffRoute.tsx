import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReactNode } from 'react';

interface StaffRouteProps {
  children: ReactNode;
}

/**
 * StaffRoute component
 * 
 * Protects routes that should only be accessible to staff members or higher roles (staff, manager, admin)
 */
const StaffRoute = ({ children }: StaffRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Allow access to staff, manager, and admin roles
  if (user && (user.role === 'staff' || user.role === 'manager' || user.role === 'admin')) {
    return children;
  }
  
  // Redirect to home page if user doesn't have sufficient permissions
  return <Navigate to="/" replace />;
};

export default StaffRoute; 