import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, CheckCircle2, Clock3, Eye, Filter, Layers3, Pencil, Plus, Search, Sparkles, Trash2, XCircle } from 'lucide-react';
import { Navigate, useOutletContext, useParams } from 'react-router-dom';
import { hrmsModules } from '../../data/hrmsModules.js';
import { api } from '../../services/api.js';
import HRMSPageHeader from '../../components/hrms/HRMSPageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import HRMSRecordFormDialog from '../../components/hrms/HRMSRecordFormDialog.jsx';
import HRMSDialog from '../../components/hrms/HRMSDialog.jsx';

const resourceByModule = { departments: 'designations' };
const text = (value = '') => String(value).replaceAll('_', ' ');
const date = (value) =>
  value
    ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(
        new Date(value),
      )
    : '—';
const money = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

function recordToRow(module, record) {
  const employee = record.employee?.name || 'Unassigned';
  const department = text(record.department || 'Unassigned');
  const data = record.data || {};
  const rows = {
    departments: [record.title, department, text(data.level), record.status],
    recruitment: [record.title, department, data.candidateCount ?? 0, data.stage || record.status],
    onboarding: [employee, department, date(data.joiningDate), `${data.progress || 0}%`],
    offboarding: [employee, department, date(data.lastDay), record.status],
    attendance: [employee, date(data.checkIn), date(data.checkOut), record.status],
    leave: [employee, text(data.leaveType), `${date(data.startDate)} – ${date(data.endDate)}`, record.status],
    shifts: [record.title, `${data.startTime || '—'} – ${data.endTime || '—'}`, `${data.hours || 0}h`, record.status],
    holidays: [record.title, date(data.date), data.date ? new Date(data.date).toLocaleDateString('en-IN', { weekday: 'long' }) : '—', text(data.type)],
    payroll: [record.title, data.employeeCount ?? 0, money(data.grossAmount, data.currency), record.status],
    performance: [record.title, data.participants ?? 0, `${data.completion || 0}%`, record.status],
    assets: [record.title, data.assignedTo ? 'Assigned employee' : 'Unassigned', department, record.status],
    documents: [record.title, text(data.category), record.updatedAt ? date(record.updatedAt) : '—', record.status],
    announcements: [record.title, data.audience || '—', date(data.publishAt || record.effectiveDate), record.status],
    settings: [record.title, String(data.value ?? '—'), text(data.scope), record.status],
  };
  return rows[module] || [record.title, department, date(record.effectiveDate), record.status];
}

function LeaveReviewDialog({ record, onOpenChange, onSaved }) {
  const [reason, setReason] = useState(record.data?.reviewerNote || '');
  const [validationError, setValidationError] = useState('');
  const mutation = useMutation({
    mutationFn: async (action) =>
      (
        await api.patch(`/hrms/leaves/requests/${record._id}/${action}`, {
          reason: reason.trim() || undefined,
        })
      ).data,
    onSuccess: async () => {
      await onSaved();
      onOpenChange(false);
    },
  });
  const action = (value) => {
    setValidationError('');
    if (value === 'reject' && !reason.trim()) {
      setValidationError('Reject karne ke liye reason required hai.');
      return;
    }
    mutation.mutate(value);
  };
  const data = record.data || {};
  const days = data.startDate && data.endDate
    ? Math.max(1, Math.round((new Date(data.endDate) - new Date(data.startDate)) / 86400000) + 1)
    : 0;
  const error = validationError || mutation.error?.response?.data?.error?.message || mutation.error?.message;
  return (
    <HRMSDialog
      open
      onOpenChange={onOpenChange}
      title="Leave request preview"
      description="Request details review karke approve, pending, ya reject karein."
    >
      <div className="grid gap-3 rounded-2xl border border-[#e2ebf3] bg-[#f8fbfe] p-4 sm:grid-cols-2">
        {[
          ['Employee', record.employee?.name || 'Unassigned'],
          ['Department', text(record.employee?.department || record.department || 'Unassigned')],
          ['Leave type', text(data.leaveType)],
          ['Duration', `${days} day${days === 1 ? '' : 's'}`],
          ['From', date(data.startDate)],
          ['To', date(data.endDate)],
        ].map(([label, value]) => <div key={label}><p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8292a5]">{label}</p><strong className="mt-1 block text-xs font-semibold text-[#173958]">{value}</strong></div>)}
      </div>
      <div className="mt-4 rounded-2xl border border-[#e7edf4] p-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8292a5]">Employee reason</p>
        <p className="mt-2 text-xs leading-5 text-[#405b75]">{data.reason || 'No reason provided.'}</p>
      </div>
      <label className="mt-4 block text-[11px] font-semibold text-[#31516f]">
        HR note / rejection reason
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={1000}
          disabled={record.status !== 'Pending'}
          className="mt-1.5 min-h-24 w-full rounded-xl border border-[#dce7f0] bg-white px-3 py-3 text-xs text-[#173958] outline-none focus:border-[#0987C4] focus:ring-4 focus:ring-[#0987c414] disabled:bg-[#f4f6f8]"
          placeholder="Pending note optional hai; rejection ke liye reason required hai."
        />
      </label>
      {error && <p role="alert" className="mt-3 rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]">{error}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[#edf2f6] pt-4">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        {record.status === 'Pending' && <>
          <Button variant="secondary" onClick={() => action('pending')} disabled={mutation.isPending} className="text-[#a56800]"><Clock3 size={15} />Keep pending</Button>
          <Button variant="secondary" onClick={() => action('reject')} disabled={mutation.isPending} className="border-[#f1cfd3] text-[#b63d49]"><XCircle size={15} />Reject</Button>
          <Button onClick={() => action('approve')} disabled={mutation.isPending}><CheckCircle2 size={15} />Accept</Button>
        </>}
      </div>
    </HRMSDialog>
  );
}

export default function HRMSModulePage() {
  const { module } = useParams();
  const config = hrmsModules[module];
  const { openHRMSNavigation } = useOutletContext();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [reviewRecord, setReviewRecord] = useState(null);
  const queryClient = useQueryClient();
  const resource = resourceByModule[module] || module;
  const recordsQuery = useQuery({
    queryKey: ['hrms-resource', resource],
    queryFn: async ({ signal }) =>
      (
        await api.get(
          module === 'reports'
            ? '/hrms/reports/summary'
            : `/hrms/${resource}`,
          { signal },
        )
      ).data,
    staleTime: 30000,
    enabled: Boolean(config),
  });
  const departmentsQuery = useQuery({
    queryKey: ['departments'],
    queryFn: async ({ signal }) => (await api.get('/departments', { signal })).data,
    staleTime: 300000,
    enabled: module === 'departments',
  });
  const entries = useMemo(() => {
    if (!config) return [];
    const source =
      module === 'reports'
        ? (recordsQuery.data?.data?.byModule || []).map((item) => ({ record: null, row: [text(item._id.module), item._id.status, item.count, 'Live aggregate'] }))
        : (recordsQuery.data?.data?.items || []).map((record) => ({ record, row: recordToRow(module, record) }));
    return source.filter(({ row }) => {
      const matchesSearch = row.join(' ').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === 'All' || row.at(-1) === status;
      return matchesSearch && matchesStatus;
    });
  }, [config, module, recordsQuery.data, search, status]);
  const deleteMutation = useMutation({
    mutationFn: async (record) => (await api.delete(`/hrms/${resource}/${record._id}`)).data,
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['hrms-resource', resource] }), queryClient.invalidateQueries({ queryKey: ['hrms-dashboard'] })]);
      setDeleteRecord(null);
    },
  });
  const refreshLeaveRecords = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['hrms-resource', resource] }),
      queryClient.invalidateQueries({ queryKey: ['hrms-dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    ]);
  };
  if (!config) return <Navigate to="/hrms/dashboard" replace />;
  const statusOptions = ['All', ...new Set(entries.map(({ row }) => row.at(-1)))];
  const liveDepartments = Array.isArray(departmentsQuery.data?.data) ? departmentsQuery.data.data : [];
  return (
    <div>
      <HRMSPageHeader title={config.title} description={config.description} onOpenNavigation={openHRMSNavigation} actions={module === 'leave' ? null : <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> {module === 'reports' ? 'Export report' : `Add ${config.noun}`}</Button>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[[module === 'reports' ? 'Report rows' : 'Live records', entries.length, Layers3, '#006EB5'], ['Active filters', (search ? 1 : 0) + (status !== 'All' ? 1 : 0), Filter, '#0987C4'], ['API status', recordsQuery.isError ? 'Unavailable' : recordsQuery.isPending ? 'Loading' : 'Connected', Sparkles, '#0a9b61']].map(([label,value,Icon,color]) => <article key={label} className="flex items-center gap-3 rounded-[16px] border border-[#edf2f7] bg-white p-4 shadow-[0_6px_20px_#376fbb07]"><span className="grid size-10 place-items-center rounded-xl bg-[#edf7fd]" style={{ color }}><Icon size={18}/></span><div><p className="text-[9px] font-medium text-[#7b8da4]">{label}</p><strong className="mt-0.5 block text-lg text-[#10254b]">{value}</strong></div></article>)}
      </div>
      {module === 'departments' && (
        <section className="mb-4 rounded-[18px] border border-[#dcecf7] bg-[#f2f9fd] p-4">
          <div className="mb-3 flex items-center gap-2"><span className="rounded-full bg-[#e4f8ed] px-2.5 py-1 text-[9px] font-semibold text-[#168055]">Live departments</span><p className="text-[10px] text-[#61758d]">Designations below remain demo preview data.</p></div>
          {departmentsQuery.isPending ? <p role="status" className="text-xs text-[#657b92]">Loading departments…</p> : departmentsQuery.isError ? <p role="alert" className="text-xs text-[#b94149]">Live departments are unavailable.</p> : <div className="flex flex-wrap gap-2">{liveDepartments.map((department) => <span key={department.slug || department.name} className="rounded-xl border border-[#dce8f1] bg-white px-3 py-2 text-[10px] font-medium text-[#315776]">{department.name || String(department).replaceAll('_',' ')}</span>)}</div>}
        </section>
      )}
      <section className="rounded-[18px] border border-[#edf2f7] bg-white p-4 shadow-[0_7px_24px_#376fbb08]">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[#dfe8f2] px-3 text-[#7890a7] focus-within:border-[#0987C4] focus-within:ring-4 focus-within:ring-[#0987c414] md:max-w-md"><Search size={16}/><input aria-label={`Search ${config.title.toLowerCase()}`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}`} className="w-full bg-transparent text-xs text-[#173958] outline-none" /></label>
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#dfe8f2] px-3 text-[#657b93]"><Filter size={15}/><span className="sr-only">Filter status</span><select aria-label="Filter status" value={status} onChange={(event) => setStatus(event.target.value)} className="bg-transparent text-xs outline-none">{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <span className="rounded-full bg-[#e8f7ef] px-3 py-1.5 text-[9px] font-semibold text-[#168055]">Live records</span>
        </div>
        {recordsQuery.isPending ? <div className="space-y-3 py-2" role="status" aria-label={`Loading ${config.title}`} >{[1,2,3,4].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-[#f1f5f9]" />)}</div> : recordsQuery.isError ? <div role="alert" className="rounded-xl bg-[#fff2f2] p-5 text-xs text-[#b94149]"><p>Unable to load live {config.title.toLowerCase()} records.</p><Button variant="secondary" size="sm" className="mt-3" onClick={() => recordsQuery.refetch()}>Retry</Button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="bg-[#f6f9fd] text-[9px] text-[#6e8097]">{(module === 'reports' ? ['Module', 'Status', 'Records', 'Source'] : config.columns).map((column) => <th key={column} className="px-3 py-3 font-semibold">{column}</th>)}{module !== 'reports' && <th className="px-3 py-3 text-right font-semibold">Actions</th>}</tr></thead><tbody>{entries.map(({ record, row }, rowIndex) => <tr key={record?._id || `${row[0]}-${rowIndex}`} className="border-b border-[#eff3f7] last:border-0">{row.map((cell, index) => <td key={`${cell}-${index}`} className="px-3 py-3 text-[10px] text-[#536a83]">{index === 0 ? <strong className="font-semibold text-[#172c4b]">{cell}</strong> : index === row.length - 1 ? <span className="rounded-lg bg-[#e8f5fd] px-2.5 py-1.5 text-[9px] font-semibold text-[#006EB5]">{cell}</span> : cell}</td>)}{record && <td className="px-3 py-2"><div className="flex justify-end gap-1">{module === 'leave' ? <button type="button" aria-label={`Review ${row[0]} leave`} className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[#eaf5fc] px-3 text-[9px] font-semibold text-[#006EB5] hover:bg-[#dceef9]" onClick={() => setReviewRecord(record)}><Eye size={14} />Preview</button> : <><button type="button" aria-label={`Edit ${row[0]}`} className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#006EB5] hover:bg-[#eaf5fc]" onClick={() => setEditRecord(record)}><Pencil size={14} /></button><button type="button" aria-label={`Delete ${row[0]}`} className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#c14851] hover:bg-[#fff0f1]" onClick={() => setDeleteRecord(record)}><Trash2 size={14} /></button></>}</div></td>}</tr>)}</tbody></table>{!entries.length && <div className="grid place-items-center py-12 text-center"><Archive size={24} className="mb-2 text-[#9fb0c0]"/><p className="text-xs font-medium text-[#536a83]">No live records found</p><p className="mt-1 text-[10px] text-[#8795a7]">Create the first record or clear filters.</p>{(search || status !== 'All') && <button type="button" className="mt-2 cursor-pointer text-[10px] font-semibold text-[#006EB5]" onClick={() => { setSearch(''); setStatus('All'); }}>Clear filters</button>}</div>}</div>}
      </section>
      {createOpen && <HRMSRecordFormDialog module={module} noun={config.noun} open onOpenChange={setCreateOpen} />}
      <HRMSRecordFormDialog key={editRecord?._id || 'record-editor'} module={module} noun={config.noun} record={editRecord} open={Boolean(editRecord)} onOpenChange={(open) => !open && setEditRecord(null)} />
      {reviewRecord && <LeaveReviewDialog key={reviewRecord._id} record={reviewRecord} onOpenChange={(open) => !open && setReviewRecord(null)} onSaved={refreshLeaveRecords} />}
      <HRMSDialog open={Boolean(deleteRecord)} onOpenChange={(open) => !open && setDeleteRecord(null)} title={`Delete ${config.noun}`} description="This archives the record and removes it from active HRMS lists.">
        <p className="rounded-xl bg-[#fff5f5] p-4 text-xs leading-5 text-[#8e3d44]">Delete <strong>{deleteRecord?.title}</strong>?</p>
        {deleteMutation.isError && <p role="alert" className="mt-3 rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]">{deleteMutation.error.response?.data?.error?.message || 'Unable to delete this record.'}</p>}
        <div className="mt-5 flex justify-end gap-3"><Button variant="secondary" onClick={() => setDeleteRecord(null)}>Cancel</Button><Button onClick={() => deleteMutation.mutate(deleteRecord)} disabled={deleteMutation.isPending} className="bg-gradient-to-br from-[#e05b65] to-[#a72f3a] shadow-[inset_0_1px_0_#ffffff55,0_3px_0_#84242d,0_8px_18px_#b63c4722]">{deleteMutation.isPending ? 'Deleting…' : 'Delete'}</Button></div>
      </HRMSDialog>
    </div>
  );
}
