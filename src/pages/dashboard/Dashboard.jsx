import { tw } from '../../lib/tailwind.js';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Plus,
  ChartNoAxesColumnIncreasing,
  BriefcaseBusiness,
  FileClock,
  UsersRound,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import KPICard from '../../components/dashboard/KPICard.jsx';
import RevenueChart from '../../components/dashboard/RevenueChart.jsx';
import ActivityFeed from '../../components/dashboard/ActivityFeed.jsx';
import ClientOverview from '../../components/dashboard/ClientOverview.jsx';
import RecentInvoices from '../../components/dashboard/RecentInvoices.jsx';
import UpcomingTasks from '../../components/dashboard/UpcomingTasks.jsx';
import { currency } from '../../data/dashboardDemo.js';
export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const now = new Date();
  const [date, setDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  );
  const greeting =
    now.getHours() < 12
      ? 'Good morning'
      : now.getHours() < 17
        ? 'Good afternoon'
        : 'Good evening';
  return (
    <>
      <div className={tw('dashboard-heading')}>
        <div>
          <p className={tw('greeting')}>
            {greeting}, {user.name.split(' ')[0]}{' '}
            <span aria-hidden="true">👋</span>
          </p>
          <h1>Dashboard</h1>
          <p className={tw('subtitle')}>
            Monitor operations, finance, clients, and team activity in one
            place.
          </p>
        </div>
        <div className={tw('heading-controls')}>
          <label className={tw('date-control')}>
            <CalendarDays size={19} />
            <input
              aria-label="Dashboard date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <Link className={tw('primary-button')} to="/invoices">
            <Plus size={19} />
            Create Invoice
          </Link>
        </div>
      </div>
      <div className={tw('demo-banner')}>
        <span className={tw('demo-dot')} />
        <strong>Demo dashboard</strong>
        <span>Illustrative data only · Business modules are coming soon</span>
        <span className={tw('demo-date')}>
          Selected date: {date || 'None'} · Sample figures are unchanged
        </span>
      </div>
      <div className={tw('kpi-grid')}>
        <KPICard
          title="Total Revenue"
          value={currency(284520)}
          change="+12.5%"
          caption="from last month"
          icon={ChartNoAxesColumnIncreasing}
          kind="line"
        />
        <KPICard
          title="Active Projects"
          value="18"
          change="+3 new"
          caption="this month"
          icon={BriefcaseBusiness}
          kind="bars"
        />
        <KPICard
          title="Pending Payments"
          value={currency(42750)}
          change="-8.2%"
          caption="from last month"
          icon={FileClock}
          kind="bars"
          negative
        />
        <KPICard
          title="Team Attendance"
          value="92%"
          change="+6%"
          caption="this week"
          icon={UsersRound}
          kind="ring"
        />
      </div>
      <div className={tw('analytics-grid')}>
        <RevenueChart />
        <ActivityFeed />
        <ClientOverview />
      </div>
      <div className={tw('lower-grid')}>
        <RecentInvoices />
        <UpcomingTasks />
      </div>
    </>
  );
}
