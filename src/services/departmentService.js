import { useQuery } from '@tanstack/react-query';
import { api } from './api.js';
export const departmentKeys = [
  'departments',
  'department',
  'hrms-employees',
  'hrms-dashboard',
  'admin-overview',
  'teamWorkspace',
  'teamLeaders',
  'hrms-onboarding',
  'hrms-resource',
  'hrms-attendance-daily',
];
export function useDepartmentOptions(enabled = true) {
  return useQuery({
    queryKey: ['departments', 'options'],
    queryFn: async ({ signal }) => {
      const rows = (await api.get('/departments', { signal })).data.data;
      if (!Array.isArray(rows)) throw new Error('Unable to load department options');
      return rows;
    },
    staleTime: 60000,
    enabled,
  });
}
export const canDepartment = (user, permission) =>
  user?.role === 'super_admin' ||
  user?.permissions?.includes('*') ||
  user?.permissions?.includes(permission);
export const departmentInput =
  'mt-1.5 min-h-10 w-full rounded-xl border border-[#dce7f0] bg-white px-3 py-2 text-xs text-[#173958] outline-none focus:border-[#0987c4] focus:ring-2 focus:ring-[#0987c420]';
export const errorText = (error) =>
  error?.response?.data?.error?.message ||
  error?.message ||
  'Unable to complete request.';
export const dateText = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
    : '-';
export const pretty = (value) => String(value || '').replaceAll('_', ' ');
