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
import SectionCard from '../../components/common/SectionCard.jsx';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const [date, setDate] = useState(indiaDate);
  const query = useQuery({
    queryKey: ['admin-overview', user?._id || user?.id || user?.email, date],
    queryFn: async ({ signal }) =>
      (await api.get('/dashboard/overview', { params: { date }, signal })).data
        .data,
    staleTime: 30000,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
  const data = query.data;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return (
    <>
      <div className={tw('dashboard-heading')}>
        <div>
          <p className={tw('greeting')}>
            {greeting}, {user?.name?.split(' ')[0] || 'Admin'}
          </p>
          <h1>Dashboard</h1>
          <p className={tw('subtitle')}>
            Live overview of finance, CRM, employees and team delivery.
          </p>
        </div>
        <div className={tw('heading-controls')}>
          <label className={tw('date-control')}>
            <CalendarDays size={19} />
            <span className="text-xs">Attendance date</span>
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
            Refresh
          </button>
          <Link className={tw('primary-button')} to="/invoices">
            <Plus size={18} />
            Create Invoice
          </Link>
        </div>
      </div>
      <p className="mb-5 text-xs text-slate-500">
        Attendance and daily reports use the selected date (IST). Other sections
        show current records.
        {data &&
          ` Updated ${new Date(data.generatedAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.`}
      </p>
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
              title="Paid Invoices"
              value={currency(data.finance.paid)}
              caption="All-time invoice value marked paid"
              icon={ChartNoAxesColumnIncreasing}
            />
            <KPICard
              title="Active Projects"
              value={data.projects.Active || 0}
              caption={`${data.projects.Planned || 0} planned / ${data.projects.Completed || 0} completed`}
              icon={BriefcaseBusiness}
            />
            <KPICard
              title="Outstanding Invoices"
              value={currency(data.finance.outstanding)}
              caption={`${currency(data.finance.overdue)} overdue / excludes drafts`}
              icon={FileClock}
            />
            <KPICard
              title="Team Attendance"
              value={`${data.attendance.percent}%`}
              caption={`${data.attendance.present} / ${data.attendance.employees} active staff checked in`}
              icon={UsersRound}
            />
          </div>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Leave requests to review', data.pendingLeaves, '/hrms/leave'],
              ['Overdue follow-ups', data.overdueFollowups, '/crm/follow-ups'],
              ['Blocked team tasks', data.taskSummary.BLOCKED || 0, '/hrms/employees'],
              ['Overdue invoices', data.finance.overdueCount, '/invoices'],
            ].map(([label, value, to]) => (
              <Link
                key={label}
                to={to}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 hover:border-sky-200"
              >
                <span className="text-xs text-slate-600">{label}</span>
                <strong className="text-xl text-sky-700">{value}</strong>
              </Link>
            ))}
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
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <SectionCard
              title="Employee Pulse"
              icon={UsersRound}
              actions={<Link to="/hrms/employees">Monitor employees</Link>}
            >
              <div className="grid grid-cols-3 gap-4 p-5">
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
              <p className="px-5 pb-5 text-xs text-slate-500">
                Not checked in includes staff on leave or non-working days.
              </p>
            </SectionCard>
            <SectionCard
              title="Delivery Status"
              icon={ClipboardCheck}
              actions={<Link to="/hrms/employees">Monitor employees</Link>}
            >
              <div className="grid grid-cols-3 gap-4 p-5">
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
        </>
      )}
    </>
  );
}
