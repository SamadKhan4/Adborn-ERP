import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, CircleAlert, Palmtree, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import HRMSDialog from '../../components/hrms/HRMSDialog.jsx';
import HRMSPageHeader from '../../components/hrms/HRMSPageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { api } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';

const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-[#dce7f0] bg-white px-3 text-xs text-[#173958] outline-none focus:border-[#0987C4] focus:ring-4 focus:ring-[#0987c414] disabled:bg-[#f4f6f8]';
const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const holidayTones = {
  company: 'border-[#bfe8dc] bg-[#e5f8f1] text-[#087658]',
  optional: 'border-[#f4dfae] bg-[#fff5dc] text-[#a36a00]',
  regional: 'border-[#d9d0f6] bg-[#f1edff] text-[#6843ba]',
};

const toDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const recordDateKey = (value) => String(value || '').slice(0, 10);
const parseDateKey = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const formatDate = (value, options = {}) => parseDateKey(recordDateKey(value)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', ...options });
const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function HolidayDialog({ dateKey, record, canManage, onOpenChange, onSaved }) {
  const [form, setForm] = useState({
    title: record?.title || '',
    date: recordDateKey(record?.data?.date) || dateKey,
    type: record?.data?.type || 'company',
    status: record?.status || 'Published',
    description: record?.data?.description || '',
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        status: form.status,
        effectiveDate: form.date,
        data: {
          date: form.date,
          type: form.type,
          description: form.description.trim() || undefined,
        },
      };
      return (await (record ? api.patch(`/hrms/holidays/${record._id}`, payload) : api.post('/hrms/holidays', payload))).data;
    },
    onSuccess: async () => {
      await onSaved();
      onOpenChange(false);
    },
  });
  const removeMutation = useMutation({
    mutationFn: async () => (await api.delete(`/hrms/holidays/${record._id}`)).data,
    onSuccess: async () => {
      await onSaved();
      onOpenChange(false);
    },
  });
  const error = mutation.error?.response?.data?.error?.message || removeMutation.error?.response?.data?.error?.message || mutation.error?.message || removeMutation.error?.message;
  return (
    <HRMSDialog
      open
      onOpenChange={onOpenChange}
      title={record ? (canManage ? 'Edit holiday' : 'Holiday details') : 'Add office holiday'}
      description={canManage ? 'Published holidays employee dashboard par automatically dikhengi.' : 'This holiday was published by HR.'}
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <label className="text-[11px] font-semibold text-[#31516f] sm:col-span-2">Holiday name<input autoFocus={!record} className={inputClass} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required maxLength={180} disabled={!canManage} /></label>
        <label className="text-[11px] font-semibold text-[#31516f]">Date<input aria-label="Holiday date" type="date" className={inputClass} value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required disabled={!canManage} /></label>
        <label className="text-[11px] font-semibold text-[#31516f]">Holiday type<select aria-label="Holiday type" className={inputClass} value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} disabled={!canManage}><option value="company">Company holiday</option><option value="optional">Optional holiday</option><option value="regional">Regional holiday</option></select></label>
        <label className="text-[11px] font-semibold text-[#31516f]">Visibility<select aria-label="Holiday visibility" className={inputClass} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} disabled={!canManage}><option value="Published">Published</option><option value="Draft">Draft</option></select></label>
        <div className="flex items-end"><span className={`inline-flex rounded-lg border px-3 py-2 text-[10px] font-semibold ${holidayTones[form.type]}`}>{form.type === 'company' ? 'Office closed' : titleCase(form.type)}</span></div>
        <label className="text-[11px] font-semibold text-[#31516f] sm:col-span-2">Description<textarea className={`${inputClass} min-h-24 py-3`} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} maxLength={1000} disabled={!canManage} placeholder="Holiday details or employee instructions" /></label>
        {error && <p role="alert" className="rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49] sm:col-span-2">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-[#edf2f6] pt-4 sm:col-span-2">
          {record && canManage && <Button type="button" variant="secondary" className="mr-auto border-[#f1cfd3] text-[#b63d49]" onClick={() => removeMutation.mutate()} disabled={removeMutation.isPending || mutation.isPending}><Trash2 size={14} />Delete</Button>}
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
          {canManage && <Button type="submit" disabled={mutation.isPending || removeMutation.isPending}>{mutation.isPending ? 'Saving…' : record ? 'Save holiday' : 'Publish holiday'}</Button>}
        </div>
      </form>
    </HRMSDialog>
  );
}

export default function HolidayCalendar() {
  const { openHRMSNavigation } = useOutletContext();
  const user = useAuthStore((state) => state.user);
  const canManage = ['super_admin', 'admin', 'hr'].includes(user.role) || user.permissions?.includes('hrms.manage');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [dialog, setDialog] = useState(null);
  const queryClient = useQueryClient();
  const days = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1 - new Date(month.getFullYear(), month.getMonth(), 1).getDay());
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  }, [month]);
  const rangeFrom = toDateKey(days[0]);
  const rangeTo = toDateKey(days.at(-1));
  const query = useQuery({
    queryKey: ['holiday-calendar', rangeFrom, rangeTo],
    queryFn: async ({ signal }) => (await api.get('/hrms/holidays/calendar-view', { params: { from: rangeFrom, to: rangeTo }, signal })).data.data.items,
    staleTime: 30000,
  });
  const holidays = useMemo(() => query.data || [], [query.data]);
  const byDate = useMemo(() => holidays.reduce((map, holiday) => {
    const key = recordDateKey(holiday.data?.date);
    map.set(key, [...(map.get(key) || []), holiday]);
    return map;
  }, new Map()), [holidays]);
  const monthHolidays = holidays.filter((holiday) => {
    const value = parseDateKey(recordDateKey(holiday.data?.date));
    return value.getFullYear() === month.getFullYear() && value.getMonth() === month.getMonth();
  });
  const refresh = async () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['holiday-calendar'] }),
    queryClient.invalidateQueries({ queryKey: ['hrms-resource', 'holidays'] }),
    queryClient.invalidateQueries({ queryKey: ['hrms-dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['employee-dashboard'] }),
  ]);
  const moveMonth = (amount) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const todayKey = toDateKey(new Date());
  const addDateKey = month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth() ? todayKey : toDateKey(month);
  const openDate = (day) => {
    const key = toDateKey(day);
    const record = byDate.get(key)?.[0] || null;
    if (record || canManage) setDialog({ dateKey: key, record });
  };
  return (
    <div>
      <HRMSPageHeader
        title="Holiday Calendar"
        description="Choose office holidays, optional holidays, and regional observances from a complete monthly calendar."
        onOpenNavigation={openHRMSNavigation}
        actions={canManage && <Button onClick={() => setDialog({ dateKey: addDateKey, record: null })}><Plus size={16} />Add holiday</Button>}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          ['This month', monthHolidays.length, CalendarDays, '#087dc4'],
          ['Office closed', monthHolidays.filter((item) => item.data?.type === 'company' && item.status === 'Published').length, Palmtree, '#07875d'],
          ['Draft holidays', monthHolidays.filter((item) => item.status === 'Draft').length, Pencil, '#a36a00'],
        ].map(([label, value, Icon, color]) => <article key={label} className="flex items-center gap-3 rounded-[16px] border border-[#edf2f7] bg-white p-4 shadow-[0_6px_20px_#376fbb07]"><span className="grid size-10 place-items-center rounded-xl bg-[#edf7fd]" style={{ color }}><Icon size={18} /></span><div><p className="text-[9px] font-medium text-[#7b8da4]">{label}</p><strong className="mt-0.5 block text-lg text-[#10254b]">{value}</strong></div></article>)}
      </div>
      <section className="overflow-hidden rounded-[20px] border border-[#e5edf6] bg-white shadow-[0_12px_38px_#315d860c]">
        <div className="flex flex-col gap-3 border-b border-[#edf2f6] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2"><button type="button" aria-label="Previous month" className="grid size-9 cursor-pointer place-items-center rounded-xl border border-[#dfe8f2] text-[#315b7d] hover:bg-[#f2f8fc]" onClick={() => moveMonth(-1)}><ChevronLeft size={17} /></button><button type="button" aria-label="Next month" className="grid size-9 cursor-pointer place-items-center rounded-xl border border-[#dfe8f2] text-[#315b7d] hover:bg-[#f2f8fc]" onClick={() => moveMonth(1)}><ChevronRight size={17} /></button><Button variant="secondary" size="sm" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</Button></div>
          <h2 className="text-lg font-bold text-[#10254b]">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
          <div className="flex flex-wrap gap-3 text-[9px] text-[#657b93]">{[['bg-[#36b38a]', 'Company'], ['bg-[#e3a321]', 'Optional'], ['bg-[#8667d8]', 'Regional']].map(([color, label]) => <span key={label} className="flex items-center gap-1.5"><i className={`size-2 rounded-full ${color}`} />{label}</span>)}</div>
        </div>
        {query.isPending ? <div className="grid min-h-[520px] place-items-center"><p role="status" className="flex items-center gap-2 text-xs text-[#657b93]"><RefreshCw size={16} className="animate-spin" />Loading holiday calendar…</p></div> : query.isError ? <div className="grid min-h-[420px] place-items-center p-6 text-center"><div><CircleAlert className="mx-auto text-[#d54b58]" /><p role="alert" className="mt-3 text-xs text-[#8f3d46]">Unable to load holiday calendar.</p><Button variant="secondary" size="sm" className="mt-3" onClick={() => query.refetch()}>Retry</Button></div></div> : <div className="overflow-x-auto"><div className="min-w-[840px]"><div className="grid grid-cols-7 border-b border-[#e8eef4] bg-[#f6f9fd]">{weekDays.map((day) => <div key={day} className="px-3 py-3 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-[#6d8097]">{day.slice(0, 3)}</div>)}</div><div className="grid grid-cols-7">{days.map((day) => {
          const key = toDateKey(day);
          const entries = byDate.get(key) || [];
          const inMonth = day.getMonth() === month.getMonth();
          const weekend = day.getDay() === 0 || day.getDay() === 6;
          return <button key={key} type="button" aria-label={`${entries.length ? 'View' : 'Add'} holiday on ${day.toLocaleDateString('en-IN', { dateStyle: 'long' })}`} onClick={() => openDate(day)} className={`min-h-[112px] border-b border-r border-[#edf2f6] p-2 text-left align-top transition-colors ${weekend ? 'bg-[#fbfcfe]' : 'bg-white'} ${canManage || entries.length ? 'cursor-pointer hover:bg-[#f2f9fd]' : 'cursor-default'} ${inMonth ? '' : 'opacity-45'}`}><span className={`grid size-7 place-items-center rounded-full text-[10px] font-semibold ${key === todayKey ? 'bg-[#087dc4] text-white' : 'text-[#3e5872]'}`}>{day.getDate()}</span><div className="mt-1.5 space-y-1">{entries.map((holiday) => <span key={holiday._id} className={`block truncate rounded-lg border px-2 py-1.5 text-[9px] font-semibold ${holidayTones[holiday.data?.type] || holidayTones.company} ${holiday.status === 'Draft' ? 'border-dashed opacity-65' : ''}`}>{holiday.title}{holiday.status === 'Draft' ? ' · Draft' : ''}</span>)}</div></button>;
        })}</div></div></div>}
      </section>
      <section className="mt-4 rounded-[18px] border border-[#edf2f7] bg-white p-4 shadow-[0_7px_24px_#376fbb08]">
        <div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-bold">{month.toLocaleDateString('en-IN', { month: 'long' })} holidays</h2><p className="mt-1 text-[9px] text-[#7b8da4]">Published holidays are visible to employees.</p></div><Palmtree size={18} className="text-[#0a956b]" /></div>
        {monthHolidays.length ? <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{monthHolidays.map((holiday) => <button type="button" key={holiday._id} onClick={() => setDialog({ dateKey: recordDateKey(holiday.data?.date), record: holiday })} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e8eef4] p-3 text-left hover:bg-[#f7fbfe]"><span className={`grid size-11 shrink-0 place-items-center rounded-xl border text-center text-[9px] font-bold leading-3 ${holidayTones[holiday.data?.type] || holidayTones.company}`}>{formatDate(holiday.data?.date, { day: '2-digit', month: 'short', year: undefined })}</span><div className="min-w-0"><strong className="block truncate text-[10px] text-[#173958]">{holiday.title}</strong><p className="mt-1 text-[9px] text-[#71849a]">{titleCase(holiday.data?.type)} · {holiday.status}</p></div></button>)}</div> : <p className="py-8 text-center text-xs text-[#7890a7]">No holidays assigned in this month.</p>}
      </section>
      {dialog && <HolidayDialog key={`${dialog.record?._id || 'new'}-${dialog.dateKey}`} {...dialog} canManage={canManage} onOpenChange={(open) => !open && setDialog(null)} onSaved={refresh} />}
    </div>
  );
}
