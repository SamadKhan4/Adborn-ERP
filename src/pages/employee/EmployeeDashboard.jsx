import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CalendarDays,
  Check,
  CircleAlert,
  Download,
  FileCheck2,
  FileText,
  Fingerprint,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Palmtree,
  Plus,
  RefreshCw,
  UserRound,
  WalletCards,
} from 'lucide-react';
import HRMSDialog from '../../components/hrms/HRMSDialog.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { api } from '../../services/api.js';

const panel =
  'rounded-[20px] border border-[#e5edf6] bg-white shadow-[0_12px_38px_#315d860c]';
const input =
  'mt-1.5 min-h-11 w-full rounded-xl border border-[#dce7f0] bg-white px-3 text-xs text-[#173958] outline-none focus:border-[#0987C4] focus:ring-4 focus:ring-[#0987c414]';
const employeeLinks = [
  ['dashboard', 'My Dashboard', LayoutDashboard],
  ['attendance', 'My Attendance', CalendarCheck2],
  ['daily-report', 'My Daily Report', FileText],
  ['leaves', 'My Leaves', CalendarDays],
  ['payslips', 'My Payslips', WalletCards],
  ['holidays', 'Holiday Calendar', Palmtree],
];

const titleCase = (value) =>
  String(value || 'Not assigned')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const time = (value) =>
  value
    ? new Date(value).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
const date = (value, options = {}) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...options,
      })
    : '—';
const duration = (minutes = 0) =>
  `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;

function Empty({ children }) {
  return <p className="py-8 text-center text-xs text-[#7890a7]">{children}</p>;
}

function DailyReportDialog({ open, onOpenChange, onSaved }) {
  const [tasks, setTasks] = useState('');
  const mutation = useMutation({
    mutationFn: async (values) =>
      (await api.post('/hrms/daily-reports', values)).data,
    onSuccess: async () => {
      await onSaved();
      onOpenChange(false);
    },
  });
  const submit = (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    mutation.mutate({
      summary: values.get('summary'),
      completedTasks: tasks
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      blockers: values.get('blockers') || undefined,
      tomorrowPlan: values.get('tomorrowPlan') || undefined,
    });
  };
  const error =
    mutation.error?.response?.data?.error?.message || mutation.error?.message;
  return (
    <HRMSDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Submit daily report"
      description="Your report is required before checkout. Add a clear summary of today’s work."
    >
      <form className="space-y-4" onSubmit={submit}>
        <label className="block text-[11px] font-semibold text-[#31516f]">
          Work summary
          <textarea
            className={`${input} min-h-28 py-3`}
            name="summary"
            minLength={10}
            maxLength={3000}
            required
            autoFocus
            placeholder="What did you complete today?"
          />
        </label>
        <label className="block text-[11px] font-semibold text-[#31516f]">
          Completed tasks
          <textarea
            className={`${input} min-h-24 py-3`}
            value={tasks}
            onChange={(event) => setTasks(event.target.value)}
            placeholder="One task per line"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-[11px] font-semibold text-[#31516f]">
            Blockers
            <textarea className={`${input} min-h-20 py-3`} name="blockers" />
          </label>
          <label className="block text-[11px] font-semibold text-[#31516f]">
            Tomorrow’s plan
            <textarea className={`${input} min-h-20 py-3`} name="tomorrowPlan" />
          </label>
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-[#edf2f6] pt-4">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting…' : 'Submit report'}
          </Button>
        </div>
      </form>
    </HRMSDialog>
  );
}

function LeaveDialog({ open, onOpenChange, onSaved }) {
  const mutation = useMutation({
    mutationFn: async (values) =>
      (await api.post('/hrms/leaves/requests', values)).data,
    onSuccess: async () => {
      await onSaved();
      onOpenChange(false);
    },
  });
  const submit = (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    mutation.mutate(Object.fromEntries(values));
  };
  const error =
    mutation.error?.response?.data?.error?.message || mutation.error?.message;
  return (
    <HRMSDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Apply for leave"
      description="Your request will be sent to HR for review."
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="text-[11px] font-semibold text-[#31516f]">
          Leave type
          <select name="leaveType" className={input} defaultValue="casual">
            <option value="casual">Casual leave</option>
            <option value="sick">Sick leave</option>
            <option value="annual">Annual leave</option>
            <option value="work_from_home">Work from home</option>
            <option value="unpaid">Unpaid leave</option>
          </select>
        </label>
        <span />
        <label className="text-[11px] font-semibold text-[#31516f]">
          From
          <input name="startDate" type="date" className={input} required />
        </label>
        <label className="text-[11px] font-semibold text-[#31516f]">
          To
          <input name="endDate" type="date" className={input} required />
        </label>
        <label className="text-[11px] font-semibold text-[#31516f] sm:col-span-2">
          Reason
          <textarea name="reason" className={`${input} min-h-24 py-3`} minLength={3} required />
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49] sm:col-span-2">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-[#edf2f6] pt-4 sm:col-span-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Sending…' : 'Send request'}
          </Button>
        </div>
      </form>
    </HRMSDialog>
  );
}

export default function EmployeeDashboard() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date());
  const [reportOpen, setReportOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const query = useQuery({
    queryKey: ['employee-dashboard'],
    queryFn: async ({ signal }) =>
      (await api.get('/hrms/employee-dashboard', { signal })).data.data,
    refetchInterval: 60000,
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['employee-dashboard'] });
  const checkIn = useMutation({
    mutationFn: async () => (await api.post('/hrms/attendance/check-in', {})).data,
    onSuccess: refresh,
  });
  const dashboard = query.data;
  const attendance = dashboard?.todayAttendance;
  const report = dashboard?.dailyReport;
  const balances = dashboard?.leaveBalances || [];
  const totalLeave = balances.reduce((sum, item) => sum + Math.max(0, item.balance), 0);
  const openMinutes = attendance?.data?.checkIn && !attendance?.data?.checkOut
    ? Math.max(0, Math.floor((now - new Date(attendance.data.checkIn)) / 60000))
    : attendance?.data?.minutesWorked || 0;
  const recentAttendance = dashboard?.recentAttendance || [];
  const presentDays = recentAttendance.filter((item) =>
    ['Present', 'Late'].includes(item.status),
  ).length;

  async function downloadPayslip(run) {
    const response = await api.get(`/hrms/payroll/payslips/${run._id}/download`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `payslip-${run.data?.year || 'year'}-${run.data?.month || 'month'}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (query.isPending)
    return (
      <div className="grid min-h-[65vh] place-items-center">
        <p role="status" className="flex items-center gap-2 text-sm text-[#52708c]">
          <RefreshCw className="animate-spin" size={18} /> Loading your workspace…
        </p>
      </div>
    );
  if (query.isError)
    return (
      <div className={`${panel} mx-auto max-w-xl p-8 text-center`}>
        <CircleAlert className="mx-auto text-[#df5360]" />
        <h1 className="mt-3 text-xl font-bold text-[#10254b]">Unable to load employee dashboard</h1>
        <p className="mt-2 text-xs text-[#71859a]">{query.error.response?.data?.error?.message || 'Please check the backend connection and try again.'}</p>
        <Button className="mt-5" onClick={() => query.refetch()}>Try again</Button>
      </div>
    );

  const employee = dashboard.employee;
  const payslips = dashboard.payslips || [];
  const latestPayslip = payslips[0]?.payrollRun;
  return (
    <div id="dashboard" className="mx-auto flex w-full max-w-[1600px] items-start gap-4 font-['Inter',sans-serif] text-[#10254b]">
      <aside className={`${panel} sticky top-4 hidden w-[220px] shrink-0 overflow-hidden lg:block`}>
        <nav aria-label="Employee workspace" className="space-y-1 p-3">
          {employeeLinks.map(([id, label, Icon], index) => (
            <a key={id} href={`#${id}`} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[11px] font-semibold transition-colors ${index === 0 ? 'bg-gradient-to-r from-[#086dda] to-[#08a8ed] text-white shadow-[0_7px_18px_#087fd32c]' : 'text-[#244267] hover:bg-[#edf7fd] hover:text-[#006eb5]'}`}>
              <Icon size={17} /> {label}
            </a>
          ))}
        </nav>
        <div className="m-3 mt-10 rounded-2xl border border-[#dceaf5] bg-gradient-to-b from-[#f2faff] to-white p-4 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-[#e2f3ff] text-[#087cc5]"><UserRound size={22} /></span>
          <strong className="mt-3 block text-sm">Need help?</strong>
          <p className="mt-1 text-[10px] leading-4 text-[#6c8198]">Reach out to HR for attendance, leave, or payroll support.</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-4">
        <nav aria-label="Employee shortcuts" className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {employeeLinks.map(([id, label, Icon]) => <a key={id} href={`#${id}`} className="flex shrink-0 items-center gap-2 rounded-full border border-[#dfeaf3] bg-white px-3 py-2 text-[10px] font-semibold text-[#31516f]"><Icon size={14} />{label}</a>)}
        </nav>

        <header className="flex flex-col gap-4 rounded-[22px] bg-[radial-gradient(circle_at_80%_0%,#e5f6ff,transparent_38%)] px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-[#5176ac]">WELCOME BACK 👋</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-[#101f67]">{employee.name}</h1>
            <p className="mt-1 text-xs text-[#5875b3]">{employee.profile?.designation || titleCase(employee.role)} <span className="mx-2">|</span> {titleCase(employee.department)} {employee.profile?.employeeCode && <><span className="mx-2">|</span>{employee.profile.employeeCode}</>}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <blockquote className="max-w-[300px] rounded-2xl bg-white/85 px-5 py-4 text-xs leading-5 text-[#5875b3] shadow-[0_8px_25px_#315d860b]">“Great things are achieved by consistent daily efforts.”</blockquote>
            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_25px_#315d860b]"><span className="grid size-10 place-items-center rounded-xl bg-[#eaf6ff] text-[#087dd8]"><CalendarDays size={19} /></span><div><strong className="block text-xs">{now.toLocaleDateString('en-IN', { weekday: 'long' })}</strong><span className="text-[10px] text-[#647ba2]">{date(now)}</span></div></div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className={`${panel} p-4`}>
            <div className="flex gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#ddf9ef] text-[#07a06b]"><Fingerprint size={25} /></span><div><p className="text-[11px] text-[#58729b]">Today’s Attendance</p><strong className="mt-1 block text-2xl text-[#111c66]">{attendance ? time(attendance.data?.checkIn) : 'Not checked in'}</strong><span className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-[10px] font-semibold ${attendance ? 'bg-[#dff8ed] text-[#07875d]' : 'bg-[#fff3df] text-[#b66d00]'}`}>{attendance?.data?.checkOut ? 'Checked out' : attendance ? 'Checked in' : 'Pending'}</span>{attendance && <p className="mt-2 text-[10px] text-[#58729b]">Working time {duration(openMinutes)}</p>}</div></div>
            {!attendance && <Button size="sm" className="mt-4 w-full" onClick={() => checkIn.mutate()} disabled={checkIn.isPending}><Fingerprint size={14} />Check in now</Button>}
          </article>
          <article id="daily-report" className={`${panel} p-4`}>
            <div className="flex gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e5f3ff] text-[#087ce3]"><FileCheck2 size={22} /></span><div className="min-w-0"><p className="text-[11px] text-[#58729b]">Today’s Report</p><strong className="mt-1 block text-base text-[#111c66]">{report ? 'Submitted' : 'Pending'}</strong><p className="mt-1 text-[10px] leading-4 text-[#58729b]">{report ? `Submitted at ${time(report.data?.submittedAt)}` : 'Submit your work report before checkout.'}</p></div></div>
            <Button size="sm" className="mt-4 w-full" disabled={Boolean(report) || !attendance} onClick={() => setReportOpen(true)}>{report ? <BadgeCheck size={14} /> : <Plus size={14} />}{report ? 'Report submitted' : 'Add daily report'}</Button>
          </article>
          <article id="leaves" className={`${panel} p-4`}>
            <div className="flex gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff0f3] text-[#f0445a]"><CalendarDays size={22} /></span><div><p className="text-[11px] text-[#58729b]">Leave Balance</p><strong className="mt-1 block text-2xl text-[#111c66]">{totalLeave}</strong><p className="text-[10px] text-[#58729b]">Available leaves</p></div></div>
            <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => setLeaveOpen(true)}>Apply for leave</Button>
          </article>
          <article className={`${panel} p-4`}>
            <div className="flex gap-3"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e8f4ff] text-[#087ce3]"><WalletCards size={22} /></span><div className="min-w-0"><p className="text-[11px] text-[#58729b]">Latest Payslip</p><strong className="mt-1 block truncate text-base text-[#111c66]">{latestPayslip?.title || 'Not available'}</strong><span className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-[10px] font-semibold ${latestPayslip ? 'bg-[#dff8ed] text-[#07875d]' : 'bg-[#eef2f6] text-[#718197]'}`}>{latestPayslip ? 'Available' : 'Pending'}</span></div></div>
            <Button variant="secondary" size="sm" className="mt-4 w-full" disabled={!latestPayslip} onClick={() => latestPayslip && downloadPayslip(latestPayslip)}><Download size={14} />Download payslip</Button>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr_0.8fr]">
          <article className={`${panel} p-4 sm:p-5`}>
            <h2 className="text-sm font-bold">Today’s Workflow</h2>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                ['1', 'Check In', Boolean(attendance), attendance ? time(attendance.data?.checkIn) : 'On login'],
                ['2', 'Daily Report', Boolean(report), report ? time(report.data?.submittedAt) : 'Before checkout'],
                ['3', 'Check Out', Boolean(attendance?.data?.checkOut), attendance?.data?.checkOut ? time(attendance.data.checkOut) : 'On logout'],
              ].map(([step, label, done, note], index) => <div key={label} className="relative"><div className="absolute left-1/2 top-4 hidden h-px w-full bg-[#dbe8f3] sm:block last:hidden" /><span className={`relative mx-auto grid size-9 place-items-center rounded-full text-xs font-bold ${done ? 'bg-[#0ca66f] text-white' : index === 1 && attendance ? 'bg-[#087ce3] text-white' : 'bg-[#e8edf4] text-[#38516f]'}`}>{done ? <Check size={16} /> : step}</span><strong className="mt-3 block text-[10px]">{label}</strong><span className={`mt-2 inline-block rounded-lg px-2 py-1 text-[9px] ${done ? 'bg-[#e1f8ed] text-[#07875d]' : 'bg-[#fff3df] text-[#b66d00]'}`}>{done ? 'Completed' : 'Pending'}</span><p className="mt-2 text-[9px] text-[#71849d]">{note}</p></div>)}
            </div>
          </article>
          <article className={`${panel} p-4`}>
            <h2 className="text-sm font-bold">Quick Actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => setReportOpen(true)} disabled={Boolean(report) || !attendance} className="grid min-h-20 cursor-pointer place-items-center rounded-xl bg-[#f5faff] p-3 text-[10px] font-semibold text-[#17366a] disabled:cursor-not-allowed disabled:opacity-45"><FileText className="text-[#087ce3]" size={19} />Daily report</button>
              <button onClick={() => setLeaveOpen(true)} className="grid min-h-20 cursor-pointer place-items-center rounded-xl bg-[#f5faff] p-3 text-[10px] font-semibold text-[#17366a]"><CalendarDays className="text-[#8c52ff]" size={19} />Apply leave</button>
              <a href="#payslips" className="grid min-h-20 place-items-center rounded-xl bg-[#f5faff] p-3 text-[10px] font-semibold text-[#17366a]"><WalletCards className="text-[#087ce3]" size={19} />Payslips</a>
              <Link to="/logout" className="grid min-h-20 place-items-center rounded-xl bg-[#fff7f7] p-3 text-[10px] font-semibold text-[#a83f4b]"><LogOut size={19} />Finish & logout</Link>
            </div>
          </article>
          <article id="holidays" className={`${panel} p-4`}>
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Upcoming Holidays</h2><Palmtree size={17} className="text-[#12a3e3]" /></div>
            <ul className="mt-3 space-y-2">
              {(dashboard.upcomingHolidays || []).slice(0, 4).map((holiday) => <li key={holiday._id} className="flex items-center gap-3 rounded-xl bg-[#f8fbfe] p-2.5"><strong className="w-9 text-center text-[10px] leading-3 text-[#17366a]">{new Date(holiday.data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</strong><span className="size-2 rounded-full bg-[#0da3e9]" /><div className="min-w-0"><p className="truncate text-[10px] font-semibold">{holiday.title}</p><p className="text-[8px] text-[#71849d]">{titleCase(holiday.data.type)} holiday</p></div></li>)}
            </ul>
            {!dashboard.upcomingHolidays?.length && <Empty>No upcoming holidays published.</Empty>}
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
          <article id="attendance" className={`${panel} overflow-hidden`}>
            <div className="flex items-center justify-between p-4 pb-3"><div><h2 className="text-sm font-bold">Recent Attendance</h2><p className="mt-1 text-[9px] text-[#7a8ca3]">{presentDays} present days in the latest {recentAttendance.length} records</p></div><CalendarCheck2 size={18} className="text-[#087ce3]" /></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left"><thead><tr className="bg-[#f5f9fd] text-[9px] text-[#657a95]">{['Date', 'Login Time', 'Logout Time', 'Status', 'Work Hours'].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{recentAttendance.slice(0, 8).map((item) => <tr key={item._id} className="border-t border-[#edf2f7] text-[10px]"><td className="px-4 py-3">{date(item.data?.date)}</td><td className="px-4 py-3">{time(item.data?.checkIn)}</td><td className="px-4 py-3">{time(item.data?.checkOut)}</td><td className="px-4 py-3"><span className="rounded-lg bg-[#dff8ed] px-2 py-1 text-[#07875d]">{item.status}</span></td><td className="px-4 py-3">{duration(item.data?.minutesWorked || 0)}</td></tr>)}</tbody></table></div>
            {!recentAttendance.length && <Empty>Your attendance will appear after check-in.</Empty>}
          </article>
          <article className={`${panel} p-4`}>
            <h2 className="text-sm font-bold">My Leave Summary</h2>
            <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
              <div className="grid size-36 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#078ce5 0 ${Math.min(100, totalLeave * 5)}%, #e8f1f8 ${Math.min(100, totalLeave * 5)}% 100%)` }}><div className="grid size-24 place-items-center rounded-full bg-white text-center"><div><strong className="block text-2xl">{totalLeave}</strong><span className="text-[9px] text-[#6b8099]">Leaves available</span></div></div></div>
              <ul className="w-full space-y-2">{balances.map((item, index) => <li key={item.leaveType} className="flex items-center gap-2 text-[10px]"><span className={`size-2 rounded-full ${index % 2 ? 'bg-[#55b3ed]' : 'bg-[#087ce3]'}`} /><span className="text-[#5f7590]">{titleCase(item.leaveType)}</span><strong className="ml-auto">{item.balance}</strong></li>)}</ul>
            </div>
            {!balances.length && <Empty>No leave balance has been assigned yet.</Empty>}
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <article id="payslips" className={`${panel} overflow-hidden`}>
            <div className="flex items-center justify-between p-4"><h2 className="text-sm font-bold">Latest Payslips</h2><WalletCards size={18} className="text-[#087ce3]" /></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left"><thead><tr className="bg-[#f5f9fd] text-[9px] text-[#657a95]"><th className="px-4 py-3">Payroll period</th><th className="px-4 py-3">Net salary</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody>{payslips.map(({ payrollRun, entry }) => <tr key={entry._id} className="border-t border-[#edf2f7] text-[10px]"><td className="px-4 py-3 font-semibold">{payrollRun.title}</td><td className="px-4 py-3">₹{Number(entry.net || 0).toLocaleString('en-IN')}</td><td className="px-4 py-3"><span className="rounded-lg bg-[#dff8ed] px-2 py-1 text-[#07875d]">Available</span></td><td className="px-4 py-3 text-right"><button onClick={() => downloadPayslip(payrollRun)} className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#e8f5ff] px-3 py-2 font-semibold text-[#0872c5]"><Download size={13} />Download</button></td></tr>)}</tbody></table></div>
            {!payslips.length && <Empty>Payslips appear after payroll approval.</Empty>}
          </article>
          <article className={`${panel} p-4`}>
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Company Announcements</h2><Megaphone size={18} className="text-[#087ce3]" /></div>
            <ul className="mt-3 space-y-2">{(dashboard.announcements || []).map((item) => <li key={item._id} className="flex gap-3 rounded-xl bg-[#f8fbfe] p-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e8f5ff] text-[#0872c5]"><Megaphone size={14} /></span><div><strong className="block text-[10px]">{item.title}</strong><p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#71849d]">{item.data?.detail}</p></div></li>)}</ul>
            {!dashboard.announcements?.length && <Empty>No announcements published.</Empty>}
          </article>
        </section>

        <div className="flex justify-end"><Link to="/logout" className="inline-flex items-center gap-2 rounded-xl bg-[#102e52] px-5 py-3 text-xs font-semibold text-white shadow-lg"><LogOut size={15} />Submit report, checkout & logout<ArrowRight size={15} /></Link></div>
      </main>
      <DailyReportDialog open={reportOpen} onOpenChange={setReportOpen} onSaved={refresh} />
      <LeaveDialog open={leaveOpen} onOpenChange={setLeaveOpen} onSaved={refresh} />
    </div>
  );
}
