import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Full Security: Production role users are strictly restricted to Factory routes ONLY
  if (user.role === 'production') {
    const isFactoryPath = location.pathname.startsWith('/dashboard/factory');
    if (!isFactoryPath) {
      return <Navigate to="/dashboard/factory" replace />;
    }
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">Loading...</div>;

  if (user) {
    if (user.role === 'production') {
      return <Navigate to="/dashboard/factory" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
