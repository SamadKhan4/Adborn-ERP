import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Eye, EyeOff, RefreshCw, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import HRMSDialog from './HRMSDialog.jsx';
import { Button } from '../ui/Button.jsx';

const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-[#dce7f0] bg-white px-3 text-xs text-[#173958] outline-none focus:border-[#0987C4] focus:ring-4 focus:ring-[#0987c414]';
const readOnlyClass = `${inputClass} cursor-default bg-[#f8fbfd] text-[#38556f]`;
const pretty = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function Field({ label, value }) {
  return <label className="block text-[11px] font-semibold text-[#31516f]">{label}<input className={readOnlyClass} readOnly value={value || '—'} /></label>;
}

function generatePassword() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const values = new Uint32Array(16);
  globalThis.crypto.getRandomValues(values);
  return [...values].map((value) => characters[value % characters.length]).join('');
}

export default function CreateEmployeeFromOnboardingDialog({ open, onOpenChange }) {
  const [onboardingId, setOnboardingId] = useState('');
  const [password, setPassword] = useState('');
  const [employeeType, setEmployeeType] = useState('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['hrms-onboarding', 'ready-for-employee'],
    queryFn: async ({ signal }) => {
      const items = (await api.get('/hrms/onboarding', { params: { limit: 100 }, signal })).data.data.items;
      return items.filter((item) => !item.employee && ['Unassigned', 'In Progress', 'Onboarded', 'Completed'].includes(item.status));
    },
    enabled: open && !credentials,
  });
  const selected = query.data?.find((item) => item._id === onboardingId);
  const mutation = useMutation({
    mutationFn: async () => (await api.post(`/hrms/employees/from-onboarding/${onboardingId}`, { temporaryPassword: password, role: employeeType })).data,
    onSuccess: async (payload) => {
      setCredentials({
        name: payload.data.employee.name,
        email: payload.data.employee.email,
        designation: payload.data.profile.designation,
        department: payload.data.employee.department,
        employeeCode: payload.data.profile.employeeCode,
        role: payload.data.employee.role,
        password,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['hrms-employees'] }),
        queryClient.invalidateQueries({ queryKey: ['hrms-onboarding'] }),
        queryClient.invalidateQueries({ queryKey: ['hrms-dashboard'] }),
      ]);
    },
  });
  const reset = () => {
    setOnboardingId('');
    setPassword('');
    setEmployeeType('employee');
    setShowPassword(false);
    setCredentials(null);
    mutation.reset();
  };
  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };
  const error = mutation.error?.response?.data?.error?.message || mutation.error?.message;
  const details = credentials || (selected ? {
    email: selected.data?.personal?.email,
    designation: selected.data?.employment?.designation,
    department: selected.department,
    employeeCode: 'Generated after creation',
  } : null);

  return (
    <HRMSDialog open={open} onOpenChange={handleOpenChange} title={credentials ? 'Employee created' : 'Add employee'} description={credentials ? 'The employee ID and temporary login password are ready.' : 'Select a created onboarding form. Onboarding does not need to be 100% complete.'}>
      {credentials ? <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#bfe4d2] bg-[#f0fbf6] p-4"><span className="grid size-11 place-items-center rounded-xl bg-[#dff6ea] text-[#07885b]"><CheckCircle2 size={22} /></span><div><strong className="block text-sm text-[#155c43]">{credentials.name} created successfully</strong><span className="text-[10px] text-[#517d6c]">Employee account is active.</span></div></div>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Email" value={credentials.email} /><Field label="Designation" value={credentials.designation} /><Field label="Department" value={pretty(credentials.department)} /><Field label="Employee type" value={pretty(credentials.role)} /><Field label="Employee ID" value={credentials.employeeCode} /></div>
        <label className="block text-[11px] font-semibold text-[#31516f]">Temporary password<span className="relative block"><input className={`${readOnlyClass} pr-11`} readOnly type={showPassword ? 'text' : 'password'} value={credentials.password} /><button type="button" className="absolute bottom-1 right-1 grid size-9 cursor-pointer place-items-center rounded-lg text-[#688099] hover:bg-[#edf6fc]" aria-label={showPassword ? 'Hide employee password' : 'Show employee password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>
        <div className="flex justify-end border-t border-[#edf2f6] pt-4"><Button type="button" onClick={() => handleOpenChange(false)}>Done</Button></div>
      </div> : query.isPending ? <div className="h-36 animate-pulse rounded-2xl bg-[#f1f5f9]" /> : query.isError ? <p role="alert" className="rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]">Unable to load onboarding forms.</p> : !query.data?.length ? <div className="rounded-2xl border border-dashed border-[#cfe0ed] bg-[#f7fbfe] p-6 text-center"><p className="text-xs font-semibold text-[#234663]">No onboarding form is ready.</p><p className="mt-1 text-[10px] text-[#70859a]">Create an onboarding form first.</p><Button asChild variant="secondary" className="mt-4"><Link to="/hrms/onboarding">Open onboarding</Link></Button></div> : <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <label className="block text-[11px] font-semibold text-[#31516f]">Name
          <select aria-label="Onboarding user" className={inputClass} required value={onboardingId} onChange={(event) => { setOnboardingId(event.target.value); setPassword(''); mutation.reset(); }}>
            <option value="">Select onboarding user</option>
            {query.data.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}
          </select>
        </label>
        {details && <div className="grid gap-3 sm:grid-cols-2"><Field label="Email" value={details.email} /><Field label="Designation" value={details.designation} /><Field label="Department" value={pretty(details.department)} /><Field label="Employee ID" value={details.employeeCode} /></div>}
        {selected && <label className="block text-[11px] font-semibold text-[#31516f]">Employee type<select aria-label="Employee type" className={inputClass} value={employeeType} onChange={(event) => setEmployeeType(event.target.value)}><option value="employee">Employee</option><option value="team_leader">Team Leader</option></select></label>}
        {selected && <label className="block text-[11px] font-semibold text-[#31516f]">Temporary password<span className="relative block"><input aria-label="Employee temporary password" className={`${inputClass} pr-11`} type={showPassword ? 'text' : 'password'} minLength="12" required placeholder="Minimum 12 characters" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" className="absolute bottom-1 right-1 grid size-9 cursor-pointer place-items-center rounded-lg text-[#688099] hover:bg-[#edf6fc]" aria-label={showPassword ? 'Hide employee password' : 'Show employee password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span><Button type="button" size="sm" variant="ghost" className="mt-2" onClick={() => { setPassword(generatePassword()); setShowPassword(true); }}><RefreshCw size={14} /> Generate password</Button></label>}
        {error && <p role="alert" className="rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-[#edf2f6] pt-4"><Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>Cancel</Button><Button type="submit" disabled={!selected || password.length < 12 || mutation.isPending}><UserPlus size={16} /> {mutation.isPending ? 'Creating…' : 'Create employee'}</Button></div>
      </form>}
    </HRMSDialog>
  );
}
