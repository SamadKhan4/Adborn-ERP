import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import HRMSDialog from './HRMSDialog.jsx';
import { Button } from '../ui/Button.jsx';

const departments = ['social_media', 'web_dev', 'graphics', 'video_editing', 'seo'];
const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-[#dce7f0] bg-white px-3 text-xs text-[#173958] outline-none focus:border-[#0987C4] focus:ring-4 focus:ring-[#0987c414]';

export default function EditEmployeeDialog({ employee, open, onOpenChange }) {
  const [form, setForm] = useState(() => ({ name: employee?.name || '', email: employee?.email || '', designation: employee?.profile?.designation || '', department: employee?.department || '', role: employee?.role === 'team_leader' ? 'team_leader' : 'employee' }));
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => (await api.patch(`/hrms/employees/${employee._id}`, { ...form, department: form.department || undefined, designation: form.designation || undefined })).data,
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['hrms-employees'] }), queryClient.invalidateQueries({ queryKey: ['hrms-dashboard'] })]);
      onOpenChange(false);
    },
  });
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const error = mutation.error?.response?.data?.error?.message || mutation.error?.message;
  return <HRMSDialog open={open} onOpenChange={onOpenChange} title="Edit employee" description="Update the employee's account and employment details.">
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
      <label className="text-[11px] font-semibold text-[#31516f]">Name<input className={inputClass} required value={form.name} onChange={update('name')} /></label>
      <label className="text-[11px] font-semibold text-[#31516f]">Email<input className={inputClass} required type="email" value={form.email} onChange={update('email')} /></label>
      <label className="text-[11px] font-semibold text-[#31516f]">Designation<input className={inputClass} value={form.designation} onChange={update('designation')} /></label>
      <label className="text-[11px] font-semibold text-[#31516f]">Department<select className={inputClass} value={form.department} onChange={update('department')}><option value="">Unassigned</option>{departments.map((department) => <option key={department} value={department}>{department.replaceAll('_', ' ')}</option>)}</select></label>
      <label className="text-[11px] font-semibold text-[#31516f]">Employee type<select className={inputClass} value={form.role} onChange={update('role')}><option value="employee">Employee</option><option value="team_leader">Team Leader</option></select></label>
      {error && <p role="alert" className="rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49] sm:col-span-2">{error}</p>}
      <div className="flex justify-end gap-3 border-t border-[#edf2f6] pt-4 sm:col-span-2"><Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save employee'}</Button></div>
    </form>
  </HRMSDialog>;
}
