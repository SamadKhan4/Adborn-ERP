import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore.js';
import { api } from '../../services/api.js';
import { Button } from '../ui/Button.jsx';
import { label } from '../../../shared/crm.js';
export const panel =
  'rounded-2xl border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_#315d8608]';
export const input =
  'mt-1 w-full min-h-10 rounded-xl border border-[#dce7f0] bg-white px-3 py-2 text-xs text-[#173958] outline-none focus:border-[#0987c4] focus:ring-2 focus:ring-[#0987c420]';
export const money = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
export const date = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';
export const can = (permissions, permission) =>
  permissions?.includes('*') || permissions?.includes(permission);
const emptyPermissions = Object.freeze([]);
export function usePermissions() {
  return useAuthStore((state) => state.user?.permissions || emptyPermissions);
}
export function useDebounced(value, delay = 350) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setResult(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return result;
}
export function useMetadata() {
  return useQuery({
    queryKey: ['crmMetadata'],
    queryFn: async () => (await api.get('/crm/metadata')).data.data,
    staleTime: 60000,
  });
}
export function useCRMMutation(
  fn,
  onSuccess,
  keys = [
    'leads',
    'lead',
    'crmDashboard',
    'pipeline',
    'crmReports',
    'leadActivities',
    'followUps',
    'notifications',
  ],
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (data) => {
      await Promise.all(
        keys.map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
      onSuccess?.(data);
    },
  });
}
export function Field({ label: title, children }) {
  return (
    <label className="block text-[11px] font-semibold text-[#48617a]">
      {title}
      {children}
    </label>
  );
}
export function Badge({ value }) {
  const color = ['WON', 'COMPLETED', 'HOT'].includes(value)
    ? 'bg-emerald-50 text-emerald-700'
    : ['LOST', 'URGENT', 'MISSED'].includes(value)
      ? 'bg-rose-50 text-rose-700'
      : 'bg-sky-50 text-sky-700';
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-semibold ${color}`}
    >
      {label(value)}
    </span>
  );
}
export function Message({ mutation }) {
  return mutation.isError ? (
    <p
      role="alert"
      className="my-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700"
    >
      {mutation.error.response?.data?.error?.message ||
        mutation.error.message ||
        'Request failed'}
    </p>
  ) : mutation.isSuccess ? (
    <p role="status" className="my-3 text-xs text-emerald-700">
      {mutation.data?.message || 'Saved successfully'}
    </p>
  ) : null;
}
export function QueryState({ query, empty = false, children }) {
  if (query.isPending)
    return (
      <div role="status" aria-label="Loading CRM" className="space-y-3">
        {[1, 2, 3].map((id) => (
          <div
            key={id}
            className="h-16 animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>
    );
  if (query.isError)
    return (
      <div role="alert" className={panel}>
        <p className="text-sm text-rose-700">
          {query.error.response?.data?.error?.message ||
            'Unable to load CRM records'}
        </p>
        <Button
          variant="secondary"
          className="mt-3"
          onClick={() => query.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  if (empty)
    return (
      <p className={`${panel} text-sm text-slate-500`}>No records found.</p>
    );
  return children;
}
export function Pager({ pagination, page, onPage }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-xs">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </Button>
      <span>
        Page {page} of {Math.max(1, pagination?.totalPages || 1)} ·{' '}
        {pagination?.total || 0} records
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= (pagination?.totalPages || 1)}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
export function AssigneeSelect({ value, onChange, required = false }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);
  const query = useQuery({
    queryKey: ['crmAssignees', debounced, page],
    queryFn: async () =>
      (await api.get('/crm/assignees', { params: { search: debounced, page } }))
        .data.data,
  });
  return (
    <div>
      <input
        aria-label="Search sales employees"
        placeholder="Search sales employees"
        value={search}
        className={input}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
      />
      <select
        aria-label="Assigned employee"
        required={required}
        className={input}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select employee</option>
        {value && !query.data?.items.some((item) => item._id === value) && (
          <option value={value}>Current owner</option>
        )}
        {query.data?.items.map((item) => (
          <option key={item._id} value={item._id}>
            {item.name} ({label(item.role)})
          </option>
        ))}
      </select>
      {query.isError && (
        <p role="alert" className="text-xs text-rose-700">
          Unable to load employees
        </p>
      )}
      <div className="mt-1 flex gap-3 text-[10px]">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous employees
        </button>
        <button
          type="button"
          disabled={!query.data?.nextPage}
          onClick={() => setPage(page + 1)}
        >
          More employees
        </button>
      </div>
    </div>
  );
}
export function downloadCSV(name, content) {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'text/csv;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
