import { createBrowserRouter, Navigate } from 'react-router';
import { useAuth } from './contexts/AuthContext';
import { Login } from './views/Auth/Login';
import { Register } from './views/Auth/Register';
import AppLayout from './components/AppLayout';
import DashboardLayout from './components/layouts/Dashboard';
import Overview from './views/Dashboard/Overview';
import InstanceDetail from './views/Dashboard/InstanceDetail';
import InstanceDashboard from './views/Dashboard/InstanceDashboard';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <Overview />,
          },
          {
            path: 'instances/:uuid',
            element: <InstanceDetail />,
          },
          {
            path: 'instance/:uuid',
            element: <InstanceDashboard />,
          },
        ],
      },
    ],
  },
]);
