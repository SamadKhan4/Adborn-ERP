import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  BarChart3,
  BellRing,
  ArrowUpRight,
  CakeSlice,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Megaphone,
  MoreHorizontal,
  Plus,
  UsersRound,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../../services/api.js';
import HRMSPageHeader from '../../components/hrms/HRMSPageHeader.jsx';
import HRMSMetricCard from '../../components/hrms/HRMSMetricCard.jsx';
import { Button } from '../../components/ui/Button.jsx';

const shortDate = (value) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
      }).format(new Date(value))
    : '—';
const relativeTime = (value) => {
  if (!value) return '';
  const hours = Math.max(1, Math.round((Date.now() - new Date(value)) / 3600000));
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
};
const leaveColors = ['#20C997', '#F4BF44', '#F15B64', '#6FBDF0'];

function Card({ title, icon: Icon, action, className = '', children }) {
  return (
    <section className={`min-w-0 rounded-[18px] border border-[#edf2f7] bg-white p-4 shadow-[0_7px_24px_#376fbb08] ${className}`}>
      <header className="mb-4 flex min-h-10 items-center gap-2.5">
        {Icon && <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e8f5fd] text-[#006EB5]"><Icon size={18} /></span>}
        <h2 className="min-w-0 flex-1 text-[13px] font-semibold leading-[1.35] tracking-[-0.02em] text-[#0c1c3e]">{title}</h2>
        {action && <div className="ml-auto grid shrink-0 place-items-center text-[#006EB5]">{action}</div>}
      </header>
      {children}
    </section>
  );
}

function ViewAllIcon({ to, label }) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#e2edf5] bg-[#f7fbfe] text-[#006EB5] transition-colors duration-200 hover:bg-[#e7f4fc]"
    >
      <ArrowUpRight size={15} />
    </Link>
  );
}

function PersonList({ items }) {
  if (!items.length)
    return <p className="rounded-xl bg-[#f6f9fd] p-4 text-center text-[10px] text-[#75869c]">No upcoming records.</p>;
  return (
    <ul className="space-y-3">
      {items.map((person) => (
        <li key={`${person.name}-${person.date}`} className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#d9effd] to-[#b9dff5] text-[10px] font-bold text-[#17466d]">{person.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
          <div className="min-w-0 flex-1"><strong className="block truncate text-[10px] font-semibold">{person.name}</strong><span className="block truncate text-[9px] text-[#7b8da5]">{person.role}</span></div>
          <time className="shrink-0 whitespace-nowrap rounded-lg bg-[#e8f5fd] px-2 py-1.5 text-[9px] font-medium text-[#006EB5]">{person.date}</time>
        </li>
      ))}
    </ul>
  );
}

function RecentEmployees({ employees, pending, error }) {
  return (
    <Card title="Recent Employees" icon={UsersRound} action={<ViewAllIcon to="/hrms/employees" label="View all employees" />} className="xl:row-span-2">
      <div className="mb-3 inline-flex rounded-full bg-[#e9f7ef] px-2.5 py-1 text-[9px] font-semibold text-[#168055]">Live employee records</div>
      {pending ? (
        <div className="space-y-3" role="status" aria-label="Loading employees">{[1, 2, 3, 4].map((item) => <div key={item} className="h-11 animate-pulse rounded-xl bg-[#f1f5f9]" />)}</div>
      ) : error ? (
        <div role="alert" className="rounded-xl bg-[#fff2f2] p-4 text-xs text-[#b94149]">Live employee records are unavailable.</div>
      ) : employees.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[590px] text-left">
            <thead><tr className="bg-[#f6f9fd] text-[9px] text-[#6e8097]">{['Employee', 'Role', 'Department', 'Status'].map((label) => <th key={label} className="px-3 py-2.5 font-semibold">{label}</th>)}</tr></thead>
            <tbody>{employees.map((employee) => <tr key={employee._id} className="border-b border-[#eff3f7] last:border-0">
              <td className="px-3 py-2.5"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-[#e3f1fb] text-[9px] font-bold text-[#14517e]">{employee.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div><strong className="block text-[10px] font-semibold">{employee.name}</strong><span className="text-[9px] text-[#8291a5]">{employee.email}</span></div></div></td>
              <td className="px-3 py-2.5 text-[10px] capitalize text-[#526882]">{employee.role.replaceAll('_', ' ')}</td>
              <td className="px-3 py-2.5 text-[10px] capitalize text-[#526882]">{employee.department?.replaceAll('_', ' ') || 'Unassigned'}</td>
              <td className="px-3 py-2.5"><span className={`rounded-lg px-2 py-1 text-[9px] font-semibold ${employee.active ? 'bg-[#e4f8ed] text-[#07885b]' : 'bg-[#fff0f0] text-[#d44852]'}`}>{employee.active ? 'Active' : 'Inactive'}</span></td>
            </tr>)}</tbody>
          </table>
        </div>
      ) : <p className="rounded-xl bg-[#f6f9fd] p-5 text-center text-xs text-[#75869c]">No live employees found.</p>}
    </Card>
  );
}

export default function HRMSDashboard() {
  const { openHRMSNavigation } = useOutletContext();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ['hrms-dashboard'],
    queryFn: async ({ signal }) =>
      (await api.get('/hrms/dashboard', { signal })).data.data,
    staleTime: 30000,
  });
  const dashboard = query.data || {};
  const hrmsKpis = [
    { label: 'Total Employees', value: dashboard.kpis?.totalEmployees ?? 0, trend: 'Live', note: 'active accounts', tone: 'blue' },
    { label: 'Present Today', value: dashboard.kpis?.presentToday ?? 0, trend: 'Live', note: 'attendance records', tone: 'green' },
    { label: 'Absent Today', value: dashboard.kpis?.absentToday ?? 0, trend: 'Live', note: 'attendance records', tone: 'red' },
    { label: 'On Leave', value: dashboard.kpis?.onLeave ?? 0, trend: 'Live', note: 'approved leave', tone: 'amber' },
  ];
  const attendanceData = (dashboard.attendanceAnalytics || []).map((item) => ({
    ...item,
    day: shortDate(item.date),
  }));
  const departmentData = dashboard.departmentEmployees || [];
  const departmentMax = Math.max(1, ...departmentData.map(({ value }) => value));
  const leaveData = (dashboard.leaveStatus || []).map((item, index) => ({
    ...item,
    color: leaveColors[index % leaveColors.length],
  }));
  const totalLeaves = leaveData.reduce((sum, item) => sum + item.value, 0);
  const birthdays = (dashboard.upcomingBirthdays || []).map((item) => ({
    name: item.employee?.name || 'Employee',
    role: item.designation || 'Team member',
    date: shortDate(item.date),
  }));
  const upcomingLeaves = (dashboard.upcomingLeaves || []).map((item) => ({
    name: item.employee?.name || 'Employee',
    role: String(item.data?.leaveType || 'Leave').replaceAll('_', ' '),
    date: `${shortDate(item.data?.startDate)}–${shortDate(item.data?.endDate)}`,
  }));
  const announcements = (dashboard.announcements || []).map((item) => ({
    title: item.title,
    detail: item.data?.detail || '',
    time: relativeTime(item.createdAt),
  }));
  const approvals = (dashboard.pendingApprovals || []).map((item) => ({
    title: `${item.module.replaceAll('_', ' ')} requests`,
    count: item.count,
    note: 'Awaiting review',
  }));
  const activities = (dashboard.recentActivities || []).map((item) => ({
    title: item.action.replaceAll('.', ' ').replaceAll('_', ' '),
    detail: item.user?.name ? `Updated by ${item.user.name}` : 'System activity',
    time: relativeTime(item.createdAt),
  }));
  return (
    <div>
      <HRMSPageHeader
        title="Human Resource Management"
        description="Manage your team, attendance, leaves, payroll, and employee information in one place."
        onOpenNavigation={openHRMSNavigation}
        actions={<><Button variant="secondary" onClick={() => query.refetch()} disabled={query.isFetching}><CalendarDays size={16} /> {query.isFetching ? 'Refreshing…' : 'Refresh live data'} <ChevronDown size={14} /></Button><Button onClick={() => navigate('/hrms/employees?add=1')}><Plus size={17} /> Add Employee</Button></>}
      />
      <div className={`mb-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] ${query.isError ? 'border-[#f1d3d6] bg-[#fff3f3] text-[#a84950]' : 'border-[#dcecf7] bg-[#eef8fd] text-[#55738d]'}`} role={query.isError ? 'alert' : 'status'}><span className={`size-1.5 rounded-full ${query.isError ? 'bg-[#e24d57]' : 'bg-[#0a9b61]'}`} /><strong>{query.isError ? 'HRMS API unavailable' : query.isPending ? 'Loading live HRMS data' : 'Live HRMS data connected'}</strong>{query.isError && <button type="button" className="ml-auto cursor-pointer font-semibold text-[#006EB5]" onClick={() => query.refetch()}>Retry</button>}</div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{hrmsKpis.map((item) => <HRMSMetricCard key={item.label} item={item} />)}</div>

      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(260px,.85fr)_minmax(260px,.8fr)]">
        <Card title="Attendance Analytics" icon={BarChart3} action={<MoreHorizontal size={18} />}>
          <p className="-mt-3 mb-3 text-[9px] text-[#8090a4]">Daily attendance trend · Live records</p>
          <div className="h-[230px] w-full">
            {attendanceData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={attendanceData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}><CartesianGrid stroke="#edf2f7" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 9, fill: '#73849c' }} axisLine={false} tickLine={false} interval={1} /><YAxis tick={{ fontSize: 9, fill: '#73849c' }} axisLine={false} tickLine={false} /><ChartTooltip cursor={{ fill: '#f4f8fc' }} contentStyle={{ borderRadius: 12, border: '1px solid #e5edf5', fontSize: 10 }} /><Bar dataKey="present" stackId="a" fill="#0987C4" radius={[0, 0, 3, 3]} /><Bar dataKey="absent" stackId="a" fill="#82C9F2" /><Bar dataKey="leave" stackId="a" fill="#D8ECF9" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-[10px] text-[#8291a5]">No attendance records in this period.</div>}
          </div>
          <div className="flex justify-center gap-4 text-[9px] text-[#6d8098]">{[['#0987C4', 'Present'], ['#82C9F2', 'Absent'], ['#D8ECF9', 'On Leave']].map(([color, label]) => <span key={label} className="flex items-center gap-1"><i className="size-2 rounded-full" style={{ background: color }} />{label}</span>)}</div>
        </Card>
        <Card title="Leave Status" icon={CalendarDays} action="This year">
          <div className="relative mx-auto h-[170px] max-w-[210px]">{leaveData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={leaveData} dataKey="value" innerRadius={47} outerRadius={68} paddingAngle={1}>{leaveData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><ChartTooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5edf5', fontSize: 10 }} /></PieChart></ResponsiveContainer> : null}<div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><strong className="block text-xl">{totalLeaves}</strong><span className="text-[9px] text-[#7b8ba0]">Total Leaves</span></div></div></div>
          <div className="grid grid-cols-2 gap-2">{leaveData.map((item) => <span key={item.name} className="flex items-center gap-1.5 text-[9px] text-[#5f7189]"><i className="size-2 rounded-full" style={{ background: item.color }} />{item.name} <b className="ml-auto text-[#15284a]">{item.value}</b></span>)}</div>
        </Card>
        <Card title="Employees by Department" icon={UsersRound} action={<MoreHorizontal size={18} />}>
          <div className="space-y-4">{departmentData.map((item) => <div key={item.name}><div className="mb-1.5 flex justify-between text-[9px]"><span className="text-[#536984]">{item.name}</span><strong>{item.value}</strong></div><div className="h-2 overflow-hidden rounded-full bg-[#edf3f8]"><div className="h-full rounded-full bg-gradient-to-r from-[#43abe5] to-[#0987C4]" style={{ width: `${(item.value / departmentMax) * 100}%` }} /></div></div>)}{!departmentData.length && <p className="py-12 text-center text-[10px] text-[#8291a5]">No department assignments found.</p>}</div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <RecentEmployees employees={dashboard.recentEmployees || []} pending={query.isPending} error={query.isError} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <Card title="Upcoming Birthdays" icon={CakeSlice} action={<ViewAllIcon to="/hrms/employees" label="View all birthdays" />}><PersonList items={birthdays} /></Card>
          <Card title="Upcoming Leaves" icon={CalendarDays} action={<ViewAllIcon to="/hrms/leave" label="View all upcoming leaves" />}><PersonList items={upcomingLeaves} /></Card>
          <Card title="Announcements" icon={Megaphone} action={<ViewAllIcon to="/hrms/announcements" label="View all announcements" />}><ul className="space-y-3">{announcements.map((item) => <li key={item.title} className="flex gap-2.5"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#0987C4]" /><div className="min-w-0 flex-1"><strong className="block text-[10px] font-semibold">{item.title}</strong><p className="mt-0.5 text-[9px] leading-4 text-[#7c8ca1]">{item.detail}</p></div><time className="shrink-0 whitespace-nowrap text-[8px] text-[#8b99ab]">{item.time}</time></li>)}</ul></Card>
          <Card title="Pending HR Approvals" icon={ClipboardCheck} action={<ViewAllIcon to="/hrms/leave" label="Review pending HR approvals" />}><ul className="space-y-2.5">{approvals.map((item) => <li key={item.title} className="flex items-center gap-2 rounded-xl bg-[#f7fafd] p-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff3df] text-[11px] font-bold text-[#c57a00]">{item.count}</span><div className="min-w-0 flex-1"><strong className="block text-[10px] leading-4">{item.title}</strong><p className="text-[8px] leading-3 text-[#8190a4]">{item.note}</p></div></li>)}</ul></Card>
          <Card title="Recent HR Activities" icon={Clock3} action={<ViewAllIcon to="/hrms/reports" label="View all recent HR activities" />} className="sm:col-span-2"><ul className="grid gap-3 sm:grid-cols-2">{activities.map((item, index) => <li key={item.title} className="flex gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#edf8fd] text-[#0987C4]">{index % 2 ? <CheckCircle2 size={15} /> : <BellRing size={15} />}</span><div className="min-w-0 flex-1"><strong className="block text-[10px]">{item.title}</strong><p className="mt-0.5 truncate text-[9px] text-[#7b8ba1]">{item.detail}</p></div><time className="shrink-0 whitespace-nowrap text-[8px] text-[#8b99ab]">{item.time}</time></li>)}</ul></Card>
        </div>
      </div>
    </div>
  );
}
