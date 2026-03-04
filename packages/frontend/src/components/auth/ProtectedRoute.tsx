import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  minLevel?: number;
}

export function ProtectedRoute({ minLevel = 0 }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (minLevel > 0 && user && user.role.level < minLevel) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
