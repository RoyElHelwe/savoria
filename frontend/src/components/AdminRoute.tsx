import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();

  // If authentication is still loading, show nothing
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Check if user is authenticated and has admin/manager role
  if (!isAuthenticated || !user || (user.role !== 'admin' && user.role !== 'manager')) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated and has admin role, render children
  return <>{children}</>;
};

export default AdminRoute; 