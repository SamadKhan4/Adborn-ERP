import '../../styles/dashboardReference.css';
import '../../styles/dashboardDepth.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  Plus,
  RefreshCw,
  ChartNoAxesColumnIncreasing,
  BriefcaseBusiness,
  FileClock,
  UsersRound,
  ClipboardCheck,
  Download,
  Pause,
  Play,
  UserPlus,
  FileText,
  PhoneCall,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { tw } from '../../lib/tailwind.js';
import { api } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { currency, indiaDate } from '../../lib/dashboardFormat.js';
import KPICard from '../../components/dashboard/KPICard.jsx';
import RevenueChart from '../../components/dashboard/RevenueChart.jsx';
import ActivityFeed from '../../components/dashboard/ActivityFeed.jsx';
import ClientOverview from '../../components/dashboard/ClientOverview.jsx';
import RecentInvoices from '../../components/dashboard/RecentInvoices.jsx';
import UpcomingTasks from '../../components/dashboard/UpcomingTasks.jsx';
import OperatingHealth from '../../components/dashboard/OperatingHealth.jsx';
import { downloadOverview } from '../../lib/dashboardExport.js';
import SectionCard from '../../components/common/SectionCard.jsx';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [date, setDate] = useState(indiaDate);
  const [live, setLive] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const granted = (permission) =>
    user?.role === 'super_admin' ||
    user?.permissions?.includes('*') ||
    user?.permissions?.includes(permission);
  const query = useQuery({
    queryKey: ['admin-overview', user?._id || user?.id || user?.email, date],
    queryFn: async ({ signal }) =>
      (await api.get('/dashboard/overview', { params: { date }, signal })).data
        .data,
    staleTime: 30000,
    refetchInterval: live ? 60000 : false,
    refetchIntervalInBackground: false,
  });
  const data = query.data;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="overview-page reference-dashboard overview-depth">
      <div className="overview-hero">
        <div className={tw('dashboard-heading')}>
          <div>
            <p className={tw('greeting')}>
              {greeting}, {user?.name?.split(' ')[0] || 'Admin'}{' '}
              <span aria-hidden="true">{'\uD83D\uDC4B'}</span>
            </p>
            <h1>Dashboard</h1>
            <p className={tw('subtitle')}>
              Monitor operations, finance, clients, and team activity in one
              place.
            </p>
          </div>
          <div className={tw('heading-controls')}>
            <label className={tw('date-control')}>
              <CalendarDays size={17} />
              <span className="reference-date-caption">
                {date === indiaDate() ? 'Today' : 'Attendance date'}
              </span>
              <input
                aria-label="Attendance date"
                type="date"
                max={indiaDate()}
                value={date}
                onChange={(event) => {
                  if (event.target.value) setDate(event.target.value);
                }}
              />
            </label>
            <button
              className={tw('secondary-button')}
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              <RefreshCw
                size={16}
                className={query.isFetching ? 'animate-spin' : ''}
              />
              <span className="sr-only">Refresh</span>
            </button>
            <Link className={tw('primary-button')} to="/invoices">
              <Plus size={18} />
              Create Invoice
            </Link>
          </div>
        </div>
      </div>
      {query.isPending && (
        <p role="status" className="rounded-2xl bg-white p-8 text-slate-500">
          Loading live overview...
        </p>
      )}
      {query.isError && (
        <div
          role="alert"
          className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {data
            ? 'Could not refresh. Previously loaded data is shown.'
            : 'Unable to load the overview. Please retry.'}
          <button className="ml-3 underline" onClick={() => query.refetch()}>
            Retry
          </button>
        </div>
      )}
      {data && (
        <>
          <div className={tw('kpi-grid')}>
            <KPICard
              tone="blue"
              to="/invoices?status=Paid"
              series={data.revenue.map((month) => month.paid)}
              visual="line"
              title="Paid Invoices"
              value={currency(data.finance.paid)}
              caption="All-time invoice value marked paid"
              icon={ChartNoAxesColumnIncreasing}
            />
            <KPICard
              tone="blue"
              visual="bars"
              series={[
                data.projects.Planned || 0,
                data.projects.Active || 0,
                data.projects.Completed || 0,
              ]}
              title="Active Projects"
              value={data.projects.Active || 0}
              caption={`${data.projects.Planned || 0} planned / ${data.projects.Completed || 0} completed`}
              icon={BriefcaseBusiness}
            />
            <KPICard
              tone="rose"
              to="/invoices?status=Outstanding"
              visual="bars"
              series={data.revenue.map((month) =>
                Math.max(0, month.billed - month.paid),
              )}
              title="Outstanding Invoices"
              value={currency(data.finance.outstanding)}
              caption={`${currency(data.finance.overdue)} overdue / excludes drafts`}
              icon={FileClock}
            />
            <KPICard
              tone="blue"
              to="/hrms/attendance"
              progress={data.attendance.percent}
              title="Team Attendance"
              value={`${data.attendance.percent}%`}
              caption={`${data.attendance.present} / ${data.attendance.employees} active staff checked in`}
              icon={UsersRound}
            />
          </div>
          <div className={tw('analytics-grid')}>
            <RevenueChart revenue={data.revenue} />
            <ActivityFeed activities={data.activities} />
            <ClientOverview clients={data.clients} leads={data.leads} />
          </div>
          <div className={tw('lower-grid')}>
            <RecentInvoices invoices={data.invoices} />
            <UpcomingTasks tasks={data.tasks} />
          </div>
          <div className="overview-pulse-grid">
            <SectionCard
              title="Employee Pulse"
              icon={UsersRound}
              actions={<Link to="/hrms/employees">Monitor employees</Link>}
            >
              <div className="overview-pulse-metrics">
                {[
                  ['Active staff', data.attendance.employees],
                  ['Not checked in', data.attendance.notCheckedIn],
                  ['Daily reports', data.attendance.reports],
                ].map(([label, value]) => (
                  <div key={label}>
                    <strong className="text-2xl text-sky-700">{value}</strong>
                    <p className="mt-1 text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
              <p className="overview-pulse-note">
                Not checked in includes staff on leave or non-working days.
              </p>
            </SectionCard>
            <SectionCard
              title="Delivery Status"
              icon={ClipboardCheck}
              actions={<Link to="/hrms/employees">Monitor employees</Link>}
            >
              <div className="overview-pulse-metrics">
                {[
                  'TODO',
                  'IN_PROGRESS',
                  'REVIEW',
                  'BLOCKED',
                  'DONE',
                  'BACKLOG',
                ].map((status) => (
                  <div key={status}>
                    <strong className="text-xl text-sky-700">
                      {data.taskSummary[status] || 0}
                    </strong>
                    <p className="mt-1 text-xs text-slate-500">
                      {status.replaceAll('_', ' ')}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
          <details
            className="dashboard-more"
            open={moreOpen}
            onToggle={(event) => setMoreOpen(event.currentTarget.open)}
          >
            <summary>More insights and dashboard tools</summary>
            <div className="pt-4">
              <div className="overview-toolbar">
                <div className={`live-indicator ${live ? '' : 'paused'}`}>
                  <i />
                  <span>
                    {live ? 'Live updates every minute' : 'Auto-refresh paused'}
                  </span>
                  {data && (
                    <span>
                      Updated{' '}
                      {new Date(data.generatedAt).toLocaleTimeString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                      })}{' '}
                      IST
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    aria-pressed={live}
                    onClick={() => setLive((value) => !value)}
                  >
                    {live ? <Pause size={14} /> : <Play size={14} />}
                    {live ? 'Pause live updates' : 'Resume live updates'}
                  </button>
                  <button
                    onClick={() => downloadOverview(data)}
                    disabled={!data || query.isFetching}
                  >
                    <Download size={14} />
                    Export snapshot
                  </button>
                  {date !== indiaDate() && (
                    <button onClick={() => setDate(indiaDate())}>
                      Back to today
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-[10px] text-slate-500">
                Attendance and daily reports use the selected date (IST). Other
                sections show current records.
              </p>
              <nav
                aria-label="Dashboard quick actions"
                className="quick-actions"
              >
                {granted('users.manage') && (
                  <Link to="/hrms/employees?add=1">
                    <UserPlus size={16} />
                    Add Employee
                  </Link>
                )}
                {granted('quotations.read') && (
                  <Link to="/quotations">
                    <FileText size={16} />
                    Quotations
                  </Link>
                )}
                {granted('crm.leads.view') && (
                  <Link to="/crm/leads">
                    <UsersRound size={16} />
                    Manage leads
                  </Link>
                )}
                <Link to="/hrms/attendance">
                  <CalendarDays size={16} />
                  Attendance register
                </Link>
                <Link to="/hrms/employees">
                  <UsersRound size={16} />
                  Employee monitoring
                </Link>
              </nav>
              <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  [
                    'Leave requests to review',
                    data.pendingLeaves,
                    '/hrms/leave?status=Pending',
                    'purple',
                    ClipboardCheck,
                  ],
                  [
                    'Overdue follow-ups',
                    data.overdueFollowups,
                    '/crm/follow-ups?tab=overdue',
                    'rose',
                    PhoneCall,
                  ],
                  [
                    'Blocked team tasks',
                    data.taskSummary.BLOCKED || 0,
                    '/hrms/employees',
                    'amber',
                    AlertCircle,
                  ],
                  [
                    'Overdue invoices',
                    data.finance.overdueCount,
                    '/invoices?status=Overdue',
                    'blue',
                    FileClock,
                  ],
                ].map(([label, value, to, tone, Icon]) => (
                  <Link
                    key={label}
                    to={to}
                    className="attention-card"
                    data-tone={tone}
                  >
                    <span className="metric-icon">
                      <Icon size={21} />
                    </span>
                    <div className="flex-1">
                      <strong>{value}</strong>
                      <p>{label}</p>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-400" />
                  </Link>
                ))}
              </div>
              <OperatingHealth data={data} />
            </div>
          </details>
        </>
      )}
    </div>
  );
}
