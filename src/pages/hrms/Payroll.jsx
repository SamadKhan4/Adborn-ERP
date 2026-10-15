import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeIndianRupee, Calculator, CalendarDays, Download, Eye, FileCheck2, Pencil, RefreshCw, UserRound } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import HRMSPageHeader from '../../components/hrms/HRMSPageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { api } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';

const panel = 'rounded-[18px] border border-[#e5edf6] bg-white shadow-[0_10px_32px_#315d860c]';
const inputClass = 'mt-1.5 min-h-11 w-full rounded-xl border border-[#dce7f0] bg-white px-3 text-xs text-[#173958] outline-none focus:border-[#0987C4] focus:ring-4 focus:ring-[#0987c414] disabled:bg-[#f4f6f8]';
const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0);
const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const monthName = (year, month) => new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function Payroll() {
  const { openHRMSNavigation } = useOutletContext();
  const user = useAuthStore((state) => state.user);
  const canManage = ['super_admin', 'admin', 'hr'].includes(user.role) || user.permissions?.includes('hrms.payroll.manage');
  const queryClient = useQueryClient();
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [baseAmount, setBaseAmount] = useState('');
  const [payableAmount, setPayableAmount] = useState('');
  const [note, setNote] = useState('');
  const [manualOverride, setManualOverride] = useState(false);

  const employeesQuery = useQuery({
    queryKey: ['hrms-employees', 'payroll'],
    queryFn: async ({ signal }) => (await api.get('/hrms/employees', { params: { limit: 100, active: 'true', sort: 'name_asc' }, signal })).data.data.items,
    enabled: canManage,
    staleTime: 60000,
  });
  const payslipsQuery = useQuery({
    queryKey: ['employee-payslips'],
    queryFn: async ({ signal }) => (await api.get('/hrms/payroll/employee-payslips', { params: { limit: 100 }, signal })).data.data.items,
    staleTime: 30000,
  });
  const calculationQuery = useQuery({
    queryKey: ['employee-payroll-calculation', employeeId, month, baseAmount],
    queryFn: async ({ signal }) => (await api.get('/hrms/payroll/employee-calculation', { params: { employeeId, month, baseAmount: Number(baseAmount) }, signal })).data.data,
    enabled: canManage && Boolean(employeeId && month && Number(baseAmount) > 0),
    staleTime: 10000,
  });
  const calculation = calculationQuery.data;
  const payableValue = manualOverride ? payableAmount : calculation ? String(calculation.autoPayableAmount) : '';

  const publishMutation = useMutation({
    mutationFn: async () => (await api.post('/hrms/payroll/employee-payslips', {
      employeeId,
      month,
      baseAmount: Number(baseAmount),
      payableAmount: Number(payableValue),
      manualOverride,
      note: note.trim() || undefined,
    })).data,
    onSuccess: async (result) => {
      const savedAdjustment = Number(result.data?.entry?.snapshot?.manualAdjustment || 0);
      setPayableAmount(String(result.data?.entry?.net ?? ''));
      setManualOverride(savedAdjustment !== 0);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['employee-payslips'] }),
        queryClient.invalidateQueries({ queryKey: ['employee-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['hrms-dashboard'] }),
      ]);
    },
  });
  const payslips = payslipsQuery.data || [];
  const selectedEmployee = useMemo(() => (employeesQuery.data || []).find((employee) => employee._id === employeeId), [employeeId, employeesQuery.data]);
  const existing = payslips.find(({ payrollRun }) => String(payrollRun.employee?._id || payrollRun.employee) === employeeId && `${payrollRun.data?.year}-${String(payrollRun.data?.month).padStart(2, '0')}` === month);
  const loadPayslip = ({ payrollRun, entry }) => {
    setEmployeeId(String(payrollRun.employee?._id || payrollRun.employee));
    setMonth(`${payrollRun.data.year}-${String(payrollRun.data.month).padStart(2, '0')}`);
    setBaseAmount(String(entry.gross));
    setPayableAmount('');
    setNote(entry.snapshot?.note || '');
    setManualOverride(false);
  };
  const resetCalculation = (setter, value) => {
    setter(value);
    setManualOverride(false);
    setPayableAmount('');
    publishMutation.reset();
  };
  const downloadPayslip = async ({ payrollRun, entry }) => {
    const selectedId = payrollRun.employee?._id || payrollRun.employee || entry.employee;
    const response = await api.get(`/hrms/payroll/payslips/${payrollRun._id}/download`, { params: { employee: selectedId }, responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `payslip-${payrollRun.data.year}-${String(payrollRun.data.month).padStart(2, '0')}.pdf`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const viewPayslip = async ({ payrollRun, entry }) => {
    const selectedId = payrollRun.employee?._id || payrollRun.employee || entry.employee;
    const response = await api.get(`/hrms/payroll/payslips/${payrollRun._id}/download`, { params: { employee: selectedId, disposition: 'inline' }, responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  const publishError = publishMutation.error?.response?.data?.error?.message || publishMutation.error?.message;
  return (
    <div>
      <HRMSPageHeader
        title="Employee Payroll"
        description="Select an employee and salary month, calculate leave deductions, adjust the final payable amount, and publish the salary slip."
        onOpenNavigation={openHRMSNavigation}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          ['Published payslips', payslips.length, FileCheck2, '#07875d'],
          ['Selected employee', selectedEmployee?.name || 'Not selected', UserRound, '#087dc4'],
          ['Selected month', month ? monthName(Number(month.slice(0, 4)), Number(month.slice(5))) : 'Not selected', CalendarDays, '#7452c8'],
        ].map(([label, value, Icon, color]) => <article key={label} className={`${panel} flex items-center gap-3 p-4`}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf7fd]" style={{ color }}><Icon size={18} /></span><div className="min-w-0"><p className="text-[9px] text-[#7b8da4]">{label}</p><strong className="mt-0.5 block truncate text-sm text-[#10254b]">{value}</strong></div></article>)}
      </div>

      {canManage && <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <form className={`${panel} p-5`} onSubmit={(event) => { event.preventDefault(); publishMutation.mutate(); }}>
          <div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#e9f5fd] text-[#087dc4]"><BadgeIndianRupee size={19} /></span><div><h2 className="text-sm font-bold">Create monthly salary slip</h2><p className="mt-1 text-[9px] text-[#71849a]">Leave deduction and applicable professional tax are calculated automatically.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-[11px] font-semibold text-[#31516f] sm:col-span-2">Employee<select aria-label="Payroll employee" className={inputClass} value={employeeId} onChange={(event) => resetCalculation(setEmployeeId, event.target.value)} required><option value="">Select employee</option>{(employeesQuery.data || []).map((employee) => <option key={employee._id} value={employee._id}>{employee.name} · {titleCase(employee.department || 'Unassigned')}</option>)}</select></label>
            <label className="text-[11px] font-semibold text-[#31516f]">Salary month<input aria-label="Salary month" type="month" className={inputClass} value={month} onChange={(event) => resetCalculation(setMonth, event.target.value)} required /></label>
            <label className="text-[11px] font-semibold text-[#31516f]">Monthly salary amount<input aria-label="Monthly salary amount" type="number" min="1" step="0.01" className={inputClass} value={baseAmount} onChange={(event) => resetCalculation(setBaseAmount, event.target.value)} placeholder="e.g. 30000" required /></label>
            <label className="text-[11px] font-semibold text-[#31516f] sm:col-span-2">Final payable amount<input aria-label="Final payable amount" type="number" min="0" step="0.01" className={`${inputClass} text-base font-bold text-[#08745b]`} value={payableValue} onChange={(event) => { setPayableAmount(event.target.value); setManualOverride(true); publishMutation.reset(); }} placeholder="Auto-calculated after employee selection" required /></label>
            <label className="text-[11px] font-semibold text-[#31516f] sm:col-span-2">HR note<textarea aria-label="Payroll note" className={`${inputClass} min-h-20 py-3`} value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Bonus, adjustment, deduction, or payment note" /></label>
          </div>
          {manualOverride && calculation && Number(payableAmount) !== Number(calculation.autoPayableAmount) && <p className="mt-3 rounded-xl bg-[#fff7e5] p-3 text-[10px] text-[#956100]">Manual adjustment: <strong>{money(Number(payableAmount) - calculation.autoPayableAmount)}</strong> from auto-calculated pay.</p>}
          {publishError && <p role="alert" className="mt-3 rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]">{publishError}</p>}
          {publishMutation.isSuccess && <p role="status" className="mt-3 rounded-xl bg-[#e5f8ef] p-3 text-xs text-[#087658]">{publishMutation.data.message}. Employee dashboard par payslip available hai.</p>}
          <Button type="submit" className="mt-4 w-full" disabled={!calculation || calculationQuery.isPending || publishMutation.isPending || payableValue === ''}>{publishMutation.isPending ? 'Publishing…' : existing ? 'Update salary slip' : 'Publish salary slip'}</Button>
        </form>

        <section className={`${panel} p-5`}>
          <div className="mb-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#edf8f4] text-[#07875d]"><Calculator size={19} /></span><div><h2 className="text-sm font-bold">Automatic salary calculation</h2><p className="mt-1 text-[9px] text-[#71849a]">Base salary minus leave deduction and ₹200 professional tax above ₹10,000.</p></div></div>
          {calculationQuery.isPending ? <div className="grid min-h-64 place-items-center"><p role="status" className="flex items-center gap-2 text-xs text-[#6f8399]"><RefreshCw size={16} className="animate-spin" />Calculating salary…</p></div> : calculationQuery.isError ? <p role="alert" className="rounded-xl bg-[#fff1f2] p-4 text-xs text-[#b53e49]">{calculationQuery.error.response?.data?.error?.message || 'Unable to calculate salary.'}</p> : calculation ? <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[
              ['Days in month', calculation.daysInMonth],
              ['Approved leaves', calculation.totalLeaveDays],
              ['Per-day salary', money(calculation.perDayAmount)],
              ['Leave deduction', money(calculation.leaveDeduction)],
              ['Professional tax', money(calculation.professionalTax)],
              ['Base salary', money(calculation.baseAmount)],
              ['Auto payable', money(calculation.autoPayableAmount)],
            ].map(([label, value]) => <article key={label} className="rounded-xl border border-[#e8eef4] bg-[#f8fbfd] p-3"><p className="text-[9px] text-[#71849a]">{label}</p><strong className="mt-1 block text-base text-[#173958]">{value}</strong></article>)}</div>
            <div className="mt-4 rounded-xl border border-[#e6edf4] p-4"><div className="flex items-center justify-between"><h3 className="text-[11px] font-bold">Leave breakdown</h3><span className="rounded-lg bg-[#e8f5fd] px-2 py-1 text-[9px] font-semibold text-[#0872bd]">{calculation.totalLeaveDays} days</span></div>{calculation.leaveBreakdown.length ? <ul className="mt-3 space-y-2">{calculation.leaveBreakdown.map((item) => <li key={item.leaveType} className="flex items-center justify-between text-[10px]"><span className="text-[#60778f]">{titleCase(item.leaveType)} leave</span><strong>{item.days} day{item.days === 1 ? '' : 's'}</strong></li>)}</ul> : <p className="mt-4 text-center text-[10px] text-[#8190a4]">No approved leaves in this month.</p>}</div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#0a7fbd] to-[#07527f] p-4 text-white"><div><p className="text-[9px] text-[#d8effc]">Final payable amount</p><strong className="mt-1 block text-2xl">{money(payableValue)}</strong></div><BadgeIndianRupee size={30} className="text-[#a9dcf5]" /></div>
          </> : <div className="grid min-h-64 place-items-center text-center"><div><Calculator className="mx-auto text-[#a6b5c4]" /><p className="mt-3 text-xs font-medium text-[#61778e]">Select employee, month, and salary amount</p><p className="mt-1 text-[9px] text-[#8a98a8]">Leave calculation will appear here automatically.</p></div></div>}
        </section>
      </section>}

      <section className={`${panel} mt-4 overflow-hidden`}>
        <div className="flex items-center justify-between p-4"><div><h2 className="text-sm font-bold">Employee salary slips</h2><p className="mt-1 text-[9px] text-[#71849a]">Published month-wise payslips</p></div><FileCheck2 size={18} className="text-[#07875d]" /></div>
        {payslipsQuery.isPending ? <div className="space-y-2 p-4" role="status">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-[#f1f5f9]" />)}</div> : payslipsQuery.isError ? <p role="alert" className="m-4 rounded-xl bg-[#fff1f2] p-4 text-xs text-[#b53e49]">Unable to load salary slips.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead><tr className="bg-[#f5f9fd] text-[9px] text-[#657a95]">{['Employee', 'Month', 'Base Salary', 'Leaves', 'Total Deduction', 'Payable', 'Status', 'Actions'].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{payslips.map((item) => {
          const { payrollRun, entry } = item;
          return <tr key={entry._id} className="border-t border-[#edf2f7] text-[10px]"><td className="px-4 py-3"><strong className="block text-[#173958]">{payrollRun.employee?.name || entry.employeeName}</strong><span className="text-[8px] text-[#8291a3]">{titleCase(payrollRun.employee?.department || entry.department)}</span></td><td className="px-4 py-3">{monthName(payrollRun.data.year, payrollRun.data.month)}</td><td className="px-4 py-3">{money(entry.gross)}</td><td className="px-4 py-3">{entry.snapshot?.totalLeaveDays || 0} days</td><td className="px-4 py-3 text-[#b35d37]">{money(entry.deductions)}</td><td className="px-4 py-3 font-bold text-[#087658]">{money(entry.net)}</td><td className="px-4 py-3"><span className="rounded-lg bg-[#dff8ed] px-2 py-1 font-semibold text-[#07875d]">{payrollRun.status}</span></td><td className="px-4 py-3"><div className="flex gap-1">{canManage && <button type="button" aria-label={`Edit ${payrollRun.employee?.name || entry.employeeName} payslip`} className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#0872bd] hover:bg-[#eaf5fc]" onClick={() => loadPayslip(item)}><Pencil size={14} /></button>}<button type="button" aria-label={`View ${payrollRun.employee?.name || entry.employeeName} payslip`} className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#7753c7] hover:bg-[#f2edff]" onClick={() => viewPayslip(item)}><Eye size={14} /></button><button type="button" aria-label={`Download ${payrollRun.employee?.name || entry.employeeName} payslip`} className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#087658] hover:bg-[#e8f7ef]" onClick={() => downloadPayslip(item)}><Download size={14} /></button></div></td></tr>;
        })}</tbody></table>{!payslips.length && <p className="py-12 text-center text-xs text-[#7890a7]">No employee salary slips published yet.</p>}</div>}
      </section>
    </div>
  );
}
