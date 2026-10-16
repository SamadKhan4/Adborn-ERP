import { useEffect, useState, lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import ERPLayout from './components/layout/ERPLayout.jsx';
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard.jsx'));
import ComingSoon from './pages/ComingSoon.jsx';
import Login from './pages/auth/Login.jsx';
import Logout from './pages/auth/Logout.jsx';
const Departments = lazy(() => import('./pages/Departments.jsx')); 
const DepartmentDetail = lazy(() => import('./pages/DepartmentDetail.jsx'));
import { authService } from './services/authService.js';
import { useAuthStore } from './store/authStore.js';
import { defaultRouteForRole } from './config/navigation.js';

const HRMSLayout = lazy(() => import('./components/hrms/HRMSLayout.jsx'));
const HRMSDashboard = lazy(() => import('./pages/hrms/HRMSDashboard.jsx'));
const Employees = lazy(() => import('./pages/hrms/Employees.jsx'));
const EmployeeMonitoring = lazy(() => import('./pages/hrms/EmployeeMonitoring.jsx'));
const Onboarding = lazy(() => import('./pages/hrms/Onboarding.jsx'));
const HRMSModulePage = lazy(() => import('./pages/hrms/HRMSModulePage.jsx'));
const Attendance = lazy(() => import('./pages/hrms/Attendance.jsx'));
const HolidayCalendar = lazy(() => import('./pages/hrms/HolidayCalendar.jsx'));
const Payroll = lazy(() => import('./pages/hrms/Payroll.jsx'));
const UserManagement = lazy(() => import('./pages/UserManagement.jsx'));
const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard.jsx'));
const Quotations = lazy(() => import('./pages/Quotations.jsx'));
const Invoices = lazy(() => import('./pages/Invoices.jsx'));
const CRMLayout = lazy(() => import('./components/crm/CRMLayout.jsx'));
const Leads = lazy(() => import('./pages/crm/Leads.jsx'));
const LeadDetail = lazy(() => import('./pages/crm/LeadDetail.jsx'));
const FollowUps = lazy(() => import('./pages/crm/FollowUps.jsx'));
const Pipeline = lazy(() => import('./pages/crm/Pipeline.jsx'));
const ClientDetail = lazy(() => import('./pages/crm/ClientDetail.jsx'));
const CRMOverview = lazy(() => import('./pages/crm/CRMOverview.jsx'));
const CRMReports = lazy(() => import('./pages/crm/CRMReports.jsx'));
const CRMSettings = lazy(() => import('./pages/crm/CRMSettings.jsx'));
const ActivityTimeline = lazy(() => import('./components/crm/ActivityTimeline.jsx'));
const TeamWorkspace = lazy(() => import('./pages/team/TeamWorkspace.jsx'));
const MyWork = lazy(() => import('./pages/team/MyWork.jsx'));

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
  if (!['employee', 'executive', 'team_leader'].includes(role))
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
          <Route path="/team" element={<Suspense fallback={<p role="status">Loading team workspace...</p>}><TeamWorkspace /></Suspense>} />
          <Route path="/my-work" element={<Suspense fallback={<p role="status">Loading your team tasks...</p>}><MyWork /></Suspense>} />
          {[
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
          <Route path="/departments" element={<Suspense fallback={<p role="status">Loading departments...</p>}><Departments /></Suspense>} />
          <Route path="/departments/:id" element={<Suspense fallback={<p role="status">Loading department...</p>}><DepartmentDetail /></Suspense>} />
          <Route path="/crm" element={<Suspense fallback={<p role="status">Loading CRM…</p>}><CRMLayout /></Suspense>}>
            <Route index element={<CRMOverview />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="follow-ups" element={<FollowUps />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="reports" element={<CRMReports />} />
            <Route path="settings" element={<CRMSettings />} />
            <Route path="activities" element={<ActivityTimeline />} />
          </Route>
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
              {role === 'team_leader' ? <Navigate to="/employee" replace /> : <HRMSLayout />}
              </Suspense>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HRMSDashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="employees/:id/monitoring" element={['super_admin', 'admin', 'manager', 'hr'].includes(role) ? <EmployeeMonitoring /> : <Navigate to={defaultRouteForRole(role)} replace />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="holidays" element={<HolidayCalendar />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path=":module" element={<HRMSModulePage />} />
          </Route>
        </Route>
        <Route path="/logout" element={<Logout />} />
      </Route>
      <Route path="*" element={<p>Page not found</p>} />
    </Routes>
  );
}
