import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, Clock3, Search, TimerOff, TriangleAlert, Users } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../services/api.js';
import HRMSPageHeader from '../../components/hrms/HRMSPageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';

const indiaDateValue = (value = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};
const time = (value) => value ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(value)) : '—';
const longDate = (value) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${value}T00:00:00+05:30`));
const statusStyle = {
  'On Time': 'bg-[#def8eb] text-[#087e57]',
  Late: 'bg-[#fff2d9] text-[#a86400]',
  'Half Day': 'bg-[#fff0f1] text-[#bd4652]',
};

export default function Attendance() {
  const { openHRMSNavigation } = useOutletContext();
  const today = indiaDateValue();
  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['hrms-attendance-daily', selectedDate],
    queryFn: async ({ signal }) => (await api.get('/hrms/attendance/daily', { params: { date: selectedDate }, signal })).data.data,
    refetchInterval: selectedDate === today ? 30000 : false,
  });
  const rows = useMemo(() => (query.data?.items || []).filter((item) => `${item.employee?.name || ''} ${item.employee?.email || ''}`.toLowerCase().includes(search.toLowerCase())), [query.data, search]);
  const summary = query.data?.summary || { 'On Time': 0, Late: 0, 'Half Day': 0 };
  const stats = [
    ['Employees Checked In', query.data?.total || 0, Users, '#087bc1'],
    ['On Time', summary['On Time'] || 0, CheckCircle2, '#079363'],
    ['Late', summary.Late || 0, TriangleAlert, '#d88808'],
    ['Half Day', summary['Half Day'] || 0, TimerOff, '#c94d59'],
  ];
  return <div>
    <HRMSPageHeader title="Daily Attendance" description="Review employee check-in, check-out and daily attendance status." onOpenNavigation={openHRMSNavigation} actions={<label className="flex min-h-10 items-center gap-2 rounded-xl border border-[#d9e6f0] bg-white px-3 text-[#50718e] shadow-sm"><CalendarDays size={16} /><span className="text-[10px] font-semibold">Date</span><input aria-label="Attendance date" type="date" max={today} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="bg-transparent text-xs font-semibold text-[#173958] outline-none" /></label>} />

    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, value, Icon, color]) => <article key={label} className="flex items-center gap-3 rounded-[16px] border border-[#edf2f7] bg-white p-4 shadow-[0_6px_20px_#376fbb07]"><span className="grid size-10 place-items-center rounded-xl bg-[#edf7fd]" style={{ color }}><Icon size={18} /></span><div><p className="text-[9px] font-medium text-[#7b8da4]">{label}</p><strong className="mt-0.5 block text-lg text-[#10254b]">{query.isPending ? '—' : value}</strong></div></article>)}</div>

    <section className="overflow-hidden rounded-[18px] border border-[#edf2f7] bg-white shadow-[0_7px_24px_#376fbb08]">
      <div className="flex flex-col gap-3 border-b border-[#edf2f7] p-4 md:flex-row md:items-center md:justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#0785c7]">Attendance Register</p><h2 className="mt-1 text-sm font-bold text-[#142f50]">{longDate(selectedDate)}</h2><p className="mt-1 text-[9px] text-[#788ba0]">The register refreshes automatically for today.</p></div><label className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-[#dfe8f2] px-3 text-[#7890a7] focus-within:border-[#0987C4] md:max-w-xs"><Search size={15} /><input aria-label="Search attendance employees" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee" className="w-full bg-transparent text-xs text-[#173958] outline-none" /></label></div>
      {query.isPending ? <div className="space-y-3 p-5" role="status">{[1,2,3,4].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-[#f1f5f9]" />)}</div> : query.isError ? <div role="alert" className="m-4 rounded-xl bg-[#fff2f2] p-5 text-xs text-[#b94149]"><p>Unable to load attendance for this date.</p><Button size="sm" variant="secondary" className="mt-3" onClick={() => query.refetch()}>Retry</Button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="bg-[#f6f9fd] text-[9px] uppercase tracking-wide text-[#6e8097]">{['Employee Name', 'Check In Time', 'Check Out Time', 'Status'].map((column) => <th key={column} className="px-5 py-3 font-semibold">{column}</th>)}</tr></thead><tbody>{rows.map((record) => <tr key={record._id} className="border-t border-[#edf2f7]"><td className="px-5 py-3"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-[#e5f3fc] text-[10px] font-bold text-[#11628f]">{(record.employee?.name || 'U').split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div><strong className="block text-[10px] text-[#183652]">{record.employee?.name || 'Unassigned Employee'}</strong><span className="text-[9px] text-[#7a8da2]">{record.employee?.email || 'No email'}</span></div></div></td><td className="px-5 py-3 text-[10px] font-semibold text-[#3e5871]"><span className="inline-flex items-center gap-1.5"><Clock3 size={13} className="text-[#1593d0]" />{time(record.data?.checkIn)}</span></td><td className="px-5 py-3 text-[10px] font-semibold text-[#3e5871]">{time(record.data?.checkOut)}</td><td className="px-5 py-3"><span className={`inline-flex rounded-lg px-2.5 py-1.5 text-[9px] font-bold ${statusStyle[record.attendanceStatus] || 'bg-[#edf2f7] text-[#526a82]'}`}>{record.attendanceStatus}</span></td></tr>)}</tbody></table>{!rows.length && <div className="grid place-items-center py-14 text-center"><CalendarDays size={28} className="text-[#a5cce4]" /><p className="mt-3 text-xs font-semibold text-[#506b83]">No attendance found</p><p className="mt-1 text-[9px] text-[#8798aa]">No employee check-ins are recorded for {longDate(selectedDate)}.</p></div>}</div>}
    </section>
    <div className="mt-4 rounded-xl border border-[#dcecf7] bg-[#f2f9fd] p-3 text-[9px] leading-5 text-[#58738c]"><strong className="text-[#174f75]">Status rules:</strong> Check-in by 09:50 AM is On Time. Check-in after 09:50 AM is Late. Check-in at/after 04:00 PM or check-out before 04:00 PM is Half Day. Check-out at/after 06:30 PM is On Time.</div>
  </div>;
}
