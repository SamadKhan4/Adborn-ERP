import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Filter, Pencil, Plus, Search, UserX } from 'lucide-react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import HRMSPageHeader from '../../components/hrms/HRMSPageHeader.jsx';
import CreateEmployeeFromOnboardingDialog from '../../components/hrms/CreateEmployeeFromOnboardingDialog.jsx';
import EditEmployeeDialog from '../../components/hrms/EditEmployeeDialog.jsx';
import HRMSDialog from '../../components/hrms/HRMSDialog.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAuthStore } from '../../store/authStore.js';

const monitoringRoles = ['super_admin', 'admin', 'manager', 'hr'];
const hrManageableRoles = new Set(['executive', 'team_leader', 'employee', 'lead_caller']);

export default function Employees() {
  const { openHRMSNavigation } = useOutletContext();
  const actorRole = useAuthStore((state) => state.user?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(searchParams.get('add') === '1');
  const [cursors, setCursors] = useState(['']);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [editEmployee, setEditEmployee] = useState(null);
  const [deactivateEmployee, setDeactivateEmployee] = useState(null);
  const queryClient = useQueryClient();
  const cursor = cursors.at(-1);
  const query = useQuery({
    queryKey: ['hrms-employees', cursor, department],
    queryFn: async ({ signal }) => (await api.get('/hrms/employees', { params: { ...(cursor && { cursor }), ...(department && { department }) }, signal })).data,
    staleTime: 60000,
  });
  const exportMutation = useMutation({
    mutationFn: async () => (await api.get('/hrms/employees/export')).data,
    onSuccess: (payload) => {
      const blob = new Blob([JSON.stringify(payload.data.items, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'adborn-employees.json'; link.click();
      URL.revokeObjectURL(url);
    },
  });
  const deactivateMutation = useMutation({
    mutationFn: async (employee) => (await api.delete(`/hrms/employees/${employee._id}`)).data,
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['hrms-employees'] }), queryClient.invalidateQueries({ queryKey: ['hrms-dashboard'] })]);
      setDeactivateEmployee(null);
    },
  });
  const records = query.data?.data?.items || [];
  const pagination = query.data?.data?.pagination;
  const rows = records.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase()));
  const departments = ['social_media', 'web_dev', 'graphics', 'video_editing', 'seo'];
  const setCreateDialogOpen = (open) => {
    setCreateOpen(open);
    if (!open && searchParams.has('add')) {
      const next = new URLSearchParams(searchParams);
      next.delete('add');
      setSearchParams(next, { replace: true });
    }
  };
  return (
    <div>
      <HRMSPageHeader title="Employee Management" description="Manage staff records and open Monitor to review individual attendance and work reports." onOpenNavigation={openHRMSNavigation} actions={<><Button variant="secondary" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}><Download size={16} /> {exportMutation.isPending ? 'Exporting…' : 'Export'}</Button>{['super_admin', 'admin', 'hr'].includes(actorRole) && <Button onClick={() => setCreateDialogOpen(true)}><Plus size={16} /> Add Employee</Button>}</>} />
      {exportMutation.isError && <p role="alert" className="mb-3 rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]">{exportMutation.error.response?.data?.error?.message || 'Employee export failed.'}</p>}
      <section className="rounded-[18px] border border-[#edf2f7] bg-white p-4 shadow-[0_7px_24px_#376fbb08]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[#dfe8f2] bg-white px-3 text-[#7790a8] focus-within:border-[#0987C4] focus-within:ring-4 focus-within:ring-[#0987c414] sm:max-w-md"><Search size={16} /><span className="sr-only">Search employees on this page</span><input aria-label="Search employees on this page" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this page by name or email" className="w-full bg-transparent text-xs text-[#173958] outline-none" /></label>
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#dfe8f2] px-3 text-[#657b93]"><Filter size={15} /><span className="sr-only">Filter by department</span><select aria-label="Filter by department" value={department} onChange={(event) => { setDepartment(event.target.value); setCursors(['']); }} className="bg-transparent text-xs outline-none"><option value="">All departments</option>{departments.map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label>
          <span className="rounded-full bg-[#e8f7ef] px-3 py-1.5 text-[9px] font-semibold text-[#168055]">Live records</span>
        </div>
        {query.isPending ? <div className="space-y-3 py-2" role="status" aria-label="Loading employees">{[1,2,3,4,5].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-[#f1f5f9]" />)}</div> : query.isError ? <div role="alert" className="rounded-xl bg-[#fff2f2] p-5 text-xs text-[#b94149]"><p>{query.error.response?.status === 403 ? 'You do not have permission to view employees.' : 'Unable to load employees.'}</p><Button variant="secondary" size="sm" className="mt-3" onClick={() => query.refetch()}>Retry</Button></div> : <>
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="bg-[#f6f9fd] text-[9px] text-[#6e8097]">{['Employee','Email','Employee Type','Department','Status','Actions'].map((label) => <th key={label} className={`px-3 py-3 font-semibold ${label === 'Actions' ? 'text-right' : ''}`}>{label}</th>)}</tr></thead><tbody>{rows.map((user) => { const canManage = ['super_admin', 'admin'].includes(actorRole) || (actorRole === 'hr' && hrManageableRoles.has(user.role)); return <tr key={user._id} className="border-b border-[#eff3f7] last:border-0"><td className="px-3 py-3"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-full bg-[#e3f1fb] text-[10px] font-bold text-[#14517e]">{user.name.split(' ').map((part) => part[0]).join('').slice(0,2)}</span><div><strong className="block text-[11px]">{user.name}</strong>{user.profile?.employeeCode && <span className="text-[9px] text-[#7a8ca0]">{user.profile.employeeCode}</span>}</div></div></td><td className="px-3 py-3 text-[10px] text-[#5d7089]">{user.email}</td><td className="px-3 py-3 text-[10px] capitalize text-[#5d7089]">{user.role.replaceAll('_',' ')}</td><td className="px-3 py-3 text-[10px] capitalize text-[#5d7089]">{user.department?.replaceAll('_',' ') || 'Unassigned'}</td><td className="px-3 py-3"><span className={`rounded-lg px-2.5 py-1.5 text-[9px] font-semibold ${user.active ? 'bg-[#e4f8ed] text-[#07885b]' : 'bg-[#fff0f0] text-[#d44852]'}`}>{user.active ? 'Active' : 'Inactive'}</span></td><td className="px-3 py-2"><div className="flex justify-end gap-1">{monitoringRoles.includes(actorRole) && <Link to={`/hrms/employees/${user._id}/monitoring`} aria-label={`Monitor ${user.name}`} className="rounded-lg px-2 py-2 text-[10px] font-semibold text-[#006EB5] hover:bg-[#eaf5fc]">Monitor</Link>}{canManage && <><button type="button" aria-label={`Edit ${user.name}`} className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#006EB5] hover:bg-[#eaf5fc]" onClick={() => setEditEmployee(user)}><Pencil size={14} /></button>{user.active && <button type="button" aria-label={`Deactivate ${user.name}`} className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#c14851] hover:bg-[#fff0f1]" onClick={() => setDeactivateEmployee(user)}><UserX size={14} /></button>}</>}</div></td></tr>; })}</tbody></table>{!rows.length && <div className="py-12 text-center"><p className="text-xs font-medium text-[#536a83]">No employees found</p><p className="mt-1 text-[10px] text-[#8795a7]">Try another page filter or search term.</p></div>}</div>
          <div className="mt-4 flex items-center justify-between border-t border-[#edf2f7] pt-4"><Button variant="secondary" size="sm" disabled={cursors.length === 1} onClick={() => { setCursors((items) => items.slice(0,-1)); setSearch(''); }}>Previous</Button><span className="text-[10px] font-medium text-[#667b92]">Page {cursors.length}</span><Button variant="secondary" size="sm" disabled={!pagination?.nextCursor} onClick={() => { setCursors((items) => [...items, pagination.nextCursor]); setSearch(''); }}>Next</Button></div>
        </>}
      </section>
      <CreateEmployeeFromOnboardingDialog open={createOpen} onOpenChange={setCreateDialogOpen} />
      <EditEmployeeDialog key={editEmployee?._id || 'employee-editor'} employee={editEmployee} open={Boolean(editEmployee)} onOpenChange={(open) => !open && setEditEmployee(null)} />
      <HRMSDialog open={Boolean(deactivateEmployee)} onOpenChange={(open) => !open && setDeactivateEmployee(null)} title="Deactivate employee" description="This blocks ERP access while preserving HR records and history.">
        <p className="rounded-xl bg-[#fff5f5] p-4 text-xs text-[#8e3d44]">Deactivate <strong>{deactivateEmployee?.name}</strong>?</p>
        {deactivateMutation.isError && <p role="alert" className="mt-3 rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]">{deactivateMutation.error.response?.data?.error?.message || 'Unable to deactivate employee.'}</p>}
        <div className="mt-5 flex justify-end gap-3"><Button variant="secondary" onClick={() => setDeactivateEmployee(null)}>Cancel</Button><Button onClick={() => deactivateMutation.mutate(deactivateEmployee)} disabled={deactivateMutation.isPending} className="bg-gradient-to-br from-[#e05b65] to-[#a72f3a] shadow-[inset_0_1px_0_#ffffff55,0_3px_0_#84242d,0_8px_18px_#b63c4722]">{deactivateMutation.isPending ? 'Deactivating…' : 'Deactivate'}</Button></div>
      </HRMSDialog>
    </div>
  );
}


