import { lazy, Suspense, type ReactElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Outlet } from 'react-router';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';

const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/auth/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })),
);
const ChangePasswordPage = lazy(() =>
  import('@/pages/auth/ChangePasswordPage').then((module) => ({ default: module.ChangePasswordPage })),
);
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const ProfilePage = lazy(() =>
  import('@/pages/profile/ProfilePage').then((module) => ({ default: module.ProfilePage })),
);
const RolesPage = lazy(() =>
  import('@/pages/admin/RolesPage').then((module) => ({ default: module.RolesPage })),
);
const UsersPage = lazy(() =>
  import('@/pages/admin/UsersPage').then((module) => ({ default: module.UsersPage })),
);
const AuditPage = lazy(() =>
  import('@/pages/admin/AuditPage').then((module) => ({ default: module.AuditPage })),
);

function RouteLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function withSuspense(node: ReactElement) {
  return <Suspense fallback={<RouteLoader />}>{node}</Suspense>;
}

function AppAuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppAuthLayout />,
    children: [
      {
        path: '/login',
        element: withSuspense(<LoginPage />),
      },
      {
        path: '/forgot-password',
        element: withSuspense(<ForgotPasswordPage />),
      },
      {
        path: '/reset-password',
        element: withSuspense(<ResetPasswordPage />),
      },
      {
        path: '/',
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'change-password',
            element: withSuspense(<ChangePasswordPage />),
          },
          {
            element: <MainLayout />,
            children: [
              {
                path: 'dashboard',
                element: withSuspense(<DashboardPage />),
              },
              {
                path: 'profile',
                element: withSuspense(<ProfilePage />),
              },
              {
                path: 'admin',
                element: <ProtectedRoute minLevel={50} />,
                children: [
                  {
                    path: 'roles',
                    element: withSuspense(<RolesPage />),
                  },
                  {
                    path: 'users',
                    element: withSuspense(<UsersPage />),
                  },
                  {
                    path: 'audit',
                    element: withSuspense(<AuditPage />),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
