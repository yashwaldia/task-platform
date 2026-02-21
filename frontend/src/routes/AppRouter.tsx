// frontend/src/routes/AppRouter.tsx — REPLACE ENTIRE FILE
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from '../components/shared/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import TasksPage from '../pages/dashboard/TasksPage';
import UsersPage from '../pages/dashboard/UsersPage';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';

// Must be inside BrowserRouter — useAuth calls useNavigate internally
const RouterContent = () => {
  const { isInitializing } = useAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Full-screen loader during silent re-auth on page refresh
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/signup"
        element={!isAuthenticated ? <SignupPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/tasks" element={<TasksPage />} />

          {/* Admin-only */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/dashboard/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const AppRouter = () => (
  <BrowserRouter>
    <RouterContent />
  </BrowserRouter>
);

export default AppRouter;
