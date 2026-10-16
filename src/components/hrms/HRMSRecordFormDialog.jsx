import { useDepartmentOptions } from '../../services/departmentService.js';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { Button } from '../ui/Button.jsx';
import HRMSDialog from './HRMSDialog.jsx';

const inputClass =
  'mt-1.5 min-h-11 w-full rounded-xl border border-[#dce7f0] bg-white px-3 text-xs text-[#173958] outline-none focus:border-[#0987C4] focus:ring-4 focus:ring-[#0987c414]';
const field = (name, label, type = 'text', extra = {}) => ({
  name,
  label,
  type,
  ...extra,
});

const forms = {
  departments: {
    endpoint: '/hrms/designations',
    fields: [
      field('title', 'Designation'),
      field('department', 'Department', 'department'),
      field('level', 'Level', 'select', {
        options: ['admin', 'manager', 'team_leader', 'executive', 'employee'],
      }),
    ],
    build: (v) => ({
      title: v.title,
      department: v.department,
      data: { level: v.level, responsibilities: [] },
    }),
  },
  recruitment: {
    endpoint: '/hrms/recruitment',
    fields: [
      field('title', 'Job opening'),
      field('department', 'Department', 'department'),
      field('openings', 'Open positions', 'number', { value: '1' }),
      field('stage', 'Stage', 'select', {
        options: ['New', 'Screening', 'Interviewing', 'Offered', 'Closed'],
      }),
    ],
    build: (v) => ({
      title: v.title,
      department: v.department,
      status: v.stage,
      data: { openings: Number(v.openings), candidateCount: 0, stage: v.stage },
    }),
  },
  onboarding: {
    endpoint: '/hrms/onboarding',
    employee: true,
    fields: [
      field('title', 'Plan title'),
      field('employee', 'Employee', 'employee'),
      field('department', 'Department', 'department'),
      field('joiningDate', 'Joining date', 'date'),
    ],
    build: (v) => ({
      title: v.title,
      employee: v.employee,
      department: v.department,
      data: { joiningDate: v.joiningDate, progress: 0, tasks: [] },
    }),
  },
  offboarding: {
    endpoint: '/hrms/offboarding',
    employee: true,
    fields: [
      field('title', 'Exit case title'),
      field('employee', 'Employee', 'employee'),
      field('department', 'Department', 'department'),
      field('lastDay', 'Last working day', 'date'),
      field('reason', 'Reason', 'textarea'),
    ],
    build: (v) => ({
      title: v.title,
      employee: v.employee,
      department: v.department,
      status: 'Pending',
      data: { lastDay: v.lastDay, progress: 0, reason: v.reason, tasks: [] },
    }),
  },
  attendance: {
    endpoint: '/hrms/attendance',
    employee: true,
    fields: [
      field('title', 'Entry title', 'text', { value: 'Attendance entry' }),
      field('employee', 'Employee', 'employee'),
      field('department', 'Department', 'department'),
      field('date', 'Attendance date', 'date'),
      field('status', 'Status', 'select', {
        options: ['Present', 'Absent', 'Late', 'On Leave'],
      }),
    ],
    build: (v) => ({
      title: v.title,
      employee: v.employee,
      department: v.department,
      status: v.status,
      effectiveDate: v.date,
      data: { date: v.date },
    }),
  },
  leave: {
    endpoint: '/hrms/leave',
    employee: true,
    fields: [
      field('title', 'Request title'),
      field('employee', 'Employee', 'employee'),
      field('department', 'Department', 'department'),
      field('leaveType', 'Leave type', 'select', {
        options: [
          'annual',
          'sick',
          'casual',
          'unpaid',
          'work_from_home',
          'other',
        ],
      }),
      field('startDate', 'Start date', 'date'),
      field('endDate', 'End date', 'date'),
      field('reason', 'Reason', 'textarea'),
    ],
    build: (v) => ({
      title: v.title,
      employee: v.employee,
      department: v.department,
      status: 'Pending',
      data: {
        leaveType: v.leaveType,
        startDate: v.startDate,
        endDate: v.endDate,
        reason: v.reason,
      },
    }),
  },
  shifts: {
    endpoint: '/hrms/shifts',
    fields: [
      field('title', 'Shift name'),
      field('startTime', 'Start time', 'time'),
      field('endTime', 'End time', 'time'),
      field('hours', 'Hours', 'number', { value: '8', step: '.25' }),
    ],
    build: (v) => ({
      title: v.title,
      data: {
        startTime: v.startTime,
        endTime: v.endTime,
        hours: Number(v.hours),
      },
    }),
  },
  holidays: {
    endpoint: '/hrms/holidays',
    fields: [
      field('title', 'Holiday name'),
      field('date', 'Date', 'date'),
      field('type', 'Type', 'select', {
        options: ['company', 'optional', 'regional'],
      }),
      field('description', 'Description', 'textarea', { required: false }),
    ],
    build: (v) => ({
      title: v.title,
      status: 'Published',
      effectiveDate: v.date,
      data: {
        date: v.date,
        type: v.type,
        description: v.description || undefined,
      },
    }),
  },
  payroll: {
    endpoint: '/hrms/payroll',
    fields: [
      field('title', 'Payroll cycle'),
      field('periodStart', 'Period start', 'date'),
      field('periodEnd', 'Period end', 'date'),
      field('employeeCount', 'Employees', 'number', { value: '0' }),
      field('grossAmount', 'Gross amount (INR)', 'number', { value: '0' }),
    ],
    build: (v) => ({
      title: v.title,
      data: {
        periodStart: v.periodStart,
        periodEnd: v.periodEnd,
        employeeCount: Number(v.employeeCount),
        grossAmount: Number(v.grossAmount),
        currency: 'INR',
      },
    }),
  },
  performance: {
    endpoint: '/hrms/performance',
    fields: [
      field('title', 'Review cycle'),
      field('period', 'Period'),
      field('participants', 'Participants', 'number', { value: '0' }),
      field('completion', 'Completion %', 'number', { value: '0', max: '100' }),
    ],
    build: (v) => ({
      title: v.title,
      data: {
        period: v.period,
        participants: Number(v.participants),
        completion: Number(v.completion),
      },
    }),
  },
  assets: {
    endpoint: '/hrms/assets',
    fields: [
      field('title', 'Asset name'),
      field('assetCode', 'Asset code'),
      field('department', 'Department', 'department'),
      field('serialNumber', 'Serial number', 'text', { required: false }),
    ],
    build: (v) => ({
      title: v.title,
      department: v.department,
      status: 'Available',
      data: {
        assetCode: v.assetCode,
        serialNumber: v.serialNumber || undefined,
      },
    }),
  },
  documents: {
    endpoint: '/hrms/documents',
    fields: [
      field('title', 'Document title'),
      field('category', 'Category', 'select', {
        options: ['policy', 'template', 'employee', 'compliance', 'other'],
      }),
      field('version', 'Version', 'text', { value: '1.0' }),
      field('fileUrl', 'Secure file URL', 'url', { required: false }),
      field('description', 'Description', 'textarea', { required: false }),
    ],
    build: (v) => ({
      title: v.title,
      status: 'Published',
      data: {
        category: v.category,
        version: v.version,
        fileUrl: v.fileUrl || undefined,
        description: v.description || undefined,
      },
    }),
  },
  announcements: {
    endpoint: '/hrms/announcements',
    fields: [
      field('title', 'Announcement title'),
      field('audience', 'Audience', 'text', { value: 'All employees' }),
      field('publishAt', 'Publish at', 'datetime-local', { required: false }),
      field('detail', 'Announcement', 'textarea'),
    ],
    build: (v) => ({
      title: v.title,
      status: 'Published',
      effectiveDate: v.publishAt || undefined,
      data: {
        detail: v.detail,
        audience: v.audience,
        publishAt: v.publishAt || undefined,
      },
    }),
  },
  settings: {
    endpoint: '/hrms/settings',
    fields: [
      field('title', 'Setting name'),
      field('key', 'Setting key', 'text', { placeholder: 'company.work_week' }),
      field('value', 'Value'),
      field('scope', 'Scope', 'select', {
        options: ['company', 'department', 'default'],
      }),
    ],
    build: (v) => ({
      title: v.title,
      data: { key: v.key, value: v.value, scope: v.scope },
    }),
  },
  reports: {
    endpoint: '/hrms/reports/exports',
    fields: [
      field('report', 'Report', 'select', {
        options: [
          'headcount',
          'attendance',
          'leaves',
          'payroll',
          'attrition',
          'recruitment',
          'performance',
          'timesheets',
          'assets',
        ],
      }),
      field('format', 'Format', 'select', { options: ['csv', 'json'] }),
    ],
    build: (v) => ({ report: v.report, format: v.format, filters: {} }),
  },
};

function initialValues(config) {
  return Object.fromEntries(
    config.fields.map((item) => [
      item.name,
      item.value || item.options?.[0] || '',
    ]),
  );
}

function inputDate(value, includeTime = false) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, includeTime ? 16 : 10);
}

function valuesFromRecord(config, record) {
  const data = record.data || {};
  return Object.fromEntries(
    config.fields.map((item) => {
      let value = data[item.name];
      if (item.name === 'title') value = record.title;
      if (item.name === 'employee')
        value = record.employee?._id || record.employee;
      if (item.name === 'department') value = record.department;
      if (item.name === 'status' || item.name === 'stage')
        value = data[item.name] || record.status;
      if (item.name === 'joiningDate')
        value = data.joiningDate || record.effectiveDate;
      if (item.name === 'publishAt')
        value = data.publishAt || record.effectiveDate;
      if (item.name === 'date') value = data.date || record.effectiveDate;
      if (item.type === 'date') value = inputDate(value);
      if (item.type === 'datetime-local') value = inputDate(value, true);
      return [item.name, value ?? item.value ?? item.options?.[0] ?? ''];
    }),
  );
}

export default function HRMSRecordFormDialog({
  module,
  noun,
  open,
  onOpenChange,
  record = null,
}) {
  const departmentOptions = useDepartmentOptions(open);
  const departments = (departmentOptions.data || []).filter(
    (item) => item.status === 'ACTIVE',
  );
  const config = forms[module];
  const [form, setForm] = useState(() =>
    record ? valuesFromRecord(config, record) : initialValues(config),
  );
  const queryClient = useQueryClient();
  const employees = useQuery({
    queryKey: ['hrms-employees', 'form'],
    queryFn: async () =>
      (
        await api.get('/hrms/employees', {
          params: { limit: 100, active: 'true', sort: 'name_asc' },
        })
      ).data.data.items,
    enabled: open && config.employee,
    staleTime: 60000,
  });
  const mutation = useMutation({
    mutationFn: async (payload) =>
      (
        await (record
          ? api.patch(`${config.endpoint}/${record._id}`, payload)
          : api.post(config.endpoint, payload))
      ).data,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['hrms-resource'] }),
        queryClient.invalidateQueries({ queryKey: ['hrms-dashboard'] }),
      ]);
      setForm(initialValues(config));
      onOpenChange(false);
    },
  });
  const title =
    module === 'reports'
      ? 'Create report export'
      : record
        ? `Edit ${noun}`
        : `Add ${noun}`;
  const error =
    mutation.error?.response?.data?.error?.message || mutation.error?.message || departmentOptions.error?.message;
  const fields = useMemo(() => config.fields, [config]);
  return (
    <HRMSDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="This form saves directly to the secured HRMS API."
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(config.build(form));
        }}
      >
        {fields.map((item) => {
          const common = {
            id: `hrms-${module}-${item.name}`,
            required: item.required !== false,
            value: form[item.name],
            onChange: (event) =>
              setForm((current) => ({
                ...current,
                [item.name]: event.target.value,
              })),
            className: inputClass,
          };
          let control;
          if (item.type === 'department')
            control = (
              <select {...common}>
                <option value="">Select department</option>
                {departments.map((value) => (
                  <option key={value.id} value={value.id}>
                    {value.name}
                  </option>
                ))}
              </select>
            );
          else if (item.type === 'employee')
            control = (
              <select {...common}>
                <option value="">Select employee</option>
                {(employees.data || []).map((value) => (
                  <option key={value._id} value={value._id}>
                    {value.name} ·{' '}
                    {value.department?.replaceAll('_', ' ') || 'Unassigned'}
                  </option>
                ))}
              </select>
            );
          else if (item.type === 'select')
            control = (
              <select {...common}>
                {item.options.map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            );
          else if (item.type === 'textarea')
            control = (
              <textarea {...common} rows="3" className={`${inputClass} py-3`} />
            );
          else
            control = (
              <input
                {...common}
                type={item.type}
                step={item.step}
                max={item.max}
                placeholder={item.placeholder}
              />
            );
          return (
            <label
              key={item.name}
              htmlFor={common.id}
              className={`text-[11px] font-semibold text-[#31516f] ${item.type === 'textarea' ? 'sm:col-span-2' : ''}`}
            >
              {item.label}
              {control}
            </label>
          );
        })}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49] sm:col-span-2"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-[#edf2f6] pt-4 sm:col-span-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || employees.isPending}
          >
            {mutation.isPending
              ? 'Saving…'
              : module === 'reports'
                ? 'Queue export'
                : record
                  ? `Save ${noun}`
                  : `Add ${noun}`}
          </Button>
        </div>
      </form>
    </HRMSDialog>
  );
}
