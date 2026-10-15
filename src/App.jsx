import { useEffect, useState, lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import ERPLayout from './components/layout/ERPLayout.jsx';
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard.jsx'));
import ComingSoon from './pages/ComingSoon.jsx';
import Login from './pages/auth/Login.jsx';
import Logout from './pages/auth/Logout.jsx';
import Departments from './pages/Departments.jsx';
import { authService } from './services/authService.js';
import { useAuthStore } from './store/authStore.js';
import { defaultRouteForRole } from './config/navigation.js';

const HRMSLayout = lazy(() => import('./components/hrms/HRMSLayout.jsx'));
const HRMSDashboard = lazy(() => import('./pages/hrms/HRMSDashboard.jsx'));
const Employees = lazy(() => import('./pages/hrms/Employees.jsx'));
const Onboarding = lazy(() => import('./pages/hrms/Onboarding.jsx'));
const HRMSModulePage = lazy(() => import('./pages/hrms/HRMSModulePage.jsx'));
const UserManagement = lazy(() => import('./pages/UserManagement.jsx'));
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard.jsx'));
const Quotations = lazy(() => import('./pages/Quotations.jsx'));
const Invoices = lazy(() => import('./pages/Invoices.jsx'));

function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
function OverviewRoute() {
  const role = useAuthStore((state) => state.user?.role);
  if (!['super_admin', 'admin', 'manager'].includes(role))
    return <Navigate to={defaultRouteForRole(role)} replace />;
  return (
    <Suspense fallback={<p role="status">Loading dashboard…</p>}>
      <Dashboard />
    </Suspense>
  );
}
function EmployeeRoute() {
  const role = useAuthStore((state) => state.user?.role);
  if (!['employee', 'executive'].includes(role))
    return <Navigate to={defaultRouteForRole(role)} replace />;
  return (
    <Suspense fallback={<p role="status">Loading employee dashboardâ€¦</p>}>
      <EmployeeDashboard />
    </Suspense>
  );
}
export default function App() {
  const initialized = useAuthStore((state) => state.isInitialized);
  const role = useAuthStore((state) => state.user?.role);
  const [error, setError] = useState('');
  const restore = () => {
    setError('');
    authService
      .restoreSession()
      .catch(() =>
        setError(
          'Unable to check your session. Please check the backend connection and retry.',
        ),
      );
  };
  useEffect(() => {
    if (!useAuthStore.getState().isInitialized) {
      authService
        .restoreSession()
        .catch(() =>
          setError(
            'Unable to check your session. Please check the backend connection and retry.',
          ),
        );
    }
  }, []);
  if (!initialized)
    return error ? (
      <main>
        <p role="alert">{error}</p>
        <button onClick={restore}>Retry</button>
      </main>
    ) : (
      <p role="status">Checking session…</p>
    );
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<ERPLayout />}>
          <Route path="/" element={<OverviewRoute />} />
          <Route path="/employee" element={<EmployeeRoute />} />
          {[
            'crm',
            'projects',
            'payments',
            'reports',
            'activity',
            'tasks',
            'leads',
            'finance',
          ].map((path) => (
            <Route key={path} path={`/${path}`} element={<ComingSoon />} />
          ))}
          <Route path="/departments" element={<Departments />} />
          <Route path="/quotations" element={<Suspense fallback={<p role="status">Loading quotationsâ€¦</p>}><Quotations /></Suspense>} />
          <Route path="/invoices" element={<Suspense fallback={<p role="status">Loading invoices…</p>}><Invoices /></Suspense>} />
          <Route
            path="/user-management"
            element={
              ['super_admin', 'admin', 'manager'].includes(
                role,
              ) ? (
                <Suspense
                  fallback={<p role="status">Loading user management…</p>}
                >
                  <UserManagement />
                </Suspense>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/hrms"
            element={
              <Suspense fallback={<p role="status">Loading HRMS workspace…</p>}>
                <HRMSLayout />
              </Suspense>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HRMSDashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path=":module" element={<HRMSModulePage />} />
          </Route>
        </Route>
        <Route path="/logout" element={<Logout />} />
      </Route>
      <Route path="*" element={<p>Page not found</p>} />
    </Routes>
  );
}
