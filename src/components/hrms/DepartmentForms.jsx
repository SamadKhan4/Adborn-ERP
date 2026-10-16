import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import HRMSDialog from './HRMSDialog.jsx';
import { Button } from '../ui/Button.jsx';
import { api } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';
import {
  canDepartment,
  departmentInput as input,
  errorText,
  useDepartmentOptions,
  departmentKeys,
} from '../../services/departmentService.js';
import { useDebounced } from '../crm/CRMShared.jsx';
export function DepartmentField({ label, children }) {
  return (
    <label className="text-xs font-semibold text-[#31516f]">
      {label}
      {children}
    </label>
  );
}
export function useDepartmentMutation(fn, onDone) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      await Promise.all(
        departmentKeys.map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
      onDone?.();
    },
  });
}
export function PeopleSelect({
  label,
  value,
  onChange,
  currentName,
  disabled = false,
  required = false,
}) {
  const [search, setSearch] = useState('');
  const term = useDebounced(search);
  const query = useQuery({
    queryKey: ['department-people', term],
    queryFn: async ({ signal }) =>
      (
        await api.get('/departments/people', {
          params: { search: term },
          signal,
        })
      ).data.data.items,
    enabled: !disabled,
  });
  const rows = query.data || [];
  return (
    <DepartmentField label={label}>
      <input
        aria-label={`Search ${label}`}
        placeholder="Search employee name"
        maxLength={100}
        disabled={disabled}
        className={input}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <select
        aria-label={label}
        required={required}
        className={input}
        value={value || ''}
        disabled={disabled || query.isPending}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{required ? 'Choose employee' : 'None'}</option>
        {value && !rows.some((row) => row._id === value) && (
          <option value={value}>{currentName || 'Current selection'}</option>
        )}
        {rows.map((row) => (
          <option key={row._id} value={row._id}>
            {row.name} ({row.role.replaceAll('_', ' ')})
          </option>
        ))}
      </select>
      <span className="mt-1 block text-[10px] font-normal text-slate-500">
        Search to find employees beyond the first 50.
      </span>
      {query.isError && (
        <span role="alert" className="text-xs text-red-700">
          {errorText(query.error)}
        </span>
      )}
    </DepartmentField>
  );
}
export function DepartmentForm({ department, onClose, onSaved }) {
  const user = useAuthStore((state) => state.user);
  const canHead = canDepartment(user, 'departments.change_head');
  const [validationError, setValidationError] = useState('');
  const [form, setForm] = useState(() => ({
    name: department?.name || '',
    code: department?.code || '',
    description: department?.description || '',
    location: department?.location || '',
    status: department?.status || 'ACTIVE',
    departmentHead:
      department?.departmentHead?._id || department?.departmentHead || '',
    reportingManager:
      department?.reportingManager?._id || department?.reportingManager || '',
    parentDepartment:
      department?.parentDepartment?._id || department?.parentDepartment || '',
  }));
  const options = useDepartmentOptions();
  const save = useDepartmentMutation(
    async () => {
      const body = {
        ...form,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        parentDepartment: form.parentDepartment || null,
        reportingManager: form.reportingManager || null,
      };
      if (canHead) body.departmentHead = form.departmentHead || null;
      else delete body.departmentHead;
      return (
        await (department
          ? api.patch(`/departments/${department._id}`, body)
          : api.post('/departments', body))
      ).data;
    },
    () => {
      onSaved?.();
      onClose();
    },
  );
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  return (
    <HRMSDialog
      open
      onOpenChange={(open) => !open && !save.isPending && onClose()}
      title={department ? 'Edit Department' : 'Add Department'}
      description="Department master and reporting structure. Name and code must be unique."
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          setValidationError('');
          if (form.name.trim().length < 2 || form.code.trim().length < 2) {
            setValidationError(
              'Name and code require at least two characters.',
            );
            return;
          }
          const duplicate = (options.data || []).find(
            (row) =>
              row._id !== department?._id &&
              (row.name.toLowerCase().replace(/\s+/g, ' ') ===
                form.name.trim().toLowerCase().replace(/\s+/g, ' ') ||
                row.code.toUpperCase() === form.code.trim().toUpperCase()),
          );
          if (duplicate) {
            setValidationError('Department name or code already exists.');
            return;
          }
          save.mutate();
        }}
      >
        <DepartmentField label="Department Name *">
          <input
            aria-label="Department Name"
            autoFocus
            required
            minLength={2}
            maxLength={120}
            className={input}
            value={form.name}
            onChange={update('name')}
          />
        </DepartmentField>
        <DepartmentField label="Department Code *">
          <input
            aria-label="Department Code"
            required
            minLength={2}
            maxLength={30}
            pattern="[a-zA-Z0-9_-]+"
            className={input}
            value={form.code}
            onChange={update('code')}
          />
        </DepartmentField>
        <PeopleSelect
          label="Department Head"
          value={form.departmentHead}
          currentName={department?.departmentHead?.name}
          onChange={(value) => setForm({ ...form, departmentHead: value })}
          disabled={!canHead}
        />
        <PeopleSelect
          label="Reporting Manager"
          value={form.reportingManager}
          currentName={department?.reportingManager?.name}
          onChange={(value) => setForm({ ...form, reportingManager: value })}
        />
        <DepartmentField label="Parent Department">
          <select
            aria-label="Parent Department"
            className={input}
            value={form.parentDepartment}
            onChange={update('parentDepartment')}
          >
            <option value="">None</option>
            {(options.data || [])
              .filter((row) => row._id !== department?._id)
              .map((row) => (
                <option key={row._id} value={row._id}>
                  {row.name}
                </option>
              ))}
          </select>
        </DepartmentField>
        <DepartmentField label="Location">
          <input
            maxLength={180}
            className={input}
            value={form.location}
            onChange={update('location')}
          />
        </DepartmentField>
        <DepartmentField label="Status">
          <select
            aria-label="Department status"
            className={input}
            value={form.status}
            onChange={update('status')}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </DepartmentField>
        <DepartmentField label="Description">
          <textarea
            maxLength={2000}
            className={input}
            value={form.description}
            onChange={update('description')}
          />
        </DepartmentField>
        {validationError && (
          <p role="alert" className="text-xs text-red-700 sm:col-span-2">
            {validationError}
          </p>
        )}
        {(save.isError || options.isError) && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-xs text-red-700 sm:col-span-2"
          >
            {errorText(save.error || options.error)}
          </p>
        )}
        <div className="flex justify-end gap-3 sm:col-span-2">
          <Button
            type="button"
            variant="secondary"
            disabled={save.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button disabled={save.isPending || options.isPending}>
            {save.isPending ? 'Saving...' : 'Save Department'}
          </Button>
        </div>
      </form>
    </HRMSDialog>
  );
}
export function DepartmentMembershipForm({
  department,
  employee,
  onClose,
  onSaved,
}) {
  const [person, setPerson] = useState(employee?._id || '');
  const [destination, setDestination] = useState(department.key);
  const [designation, setDesignation] = useState(
    employee?.profile?.designation || '',
  );
  const [manager, setManager] = useState(employee?.profile?.manager?._id || '');
  const options = useDepartmentOptions();
  const designations = useQuery({
    queryKey: ['department', destination, 'designations'],
    queryFn: async ({ signal }) =>
      (await api.get(`/departments/${destination}/designations`, { signal }))
        .data.data.items,
    enabled: Boolean(destination),
  });

  const save = useDepartmentMutation(
    async () =>
      (
        await api.post(`/departments/${destination}/employees`, {
          employee: person,
          designation: designation.trim(),
          manager: manager || null,
        })
      ).data,
    () => {
      onSaved?.();
      onClose();
    },
  );
  return (
    <HRMSDialog
      open
      onOpenChange={(open) => !open && !save.isPending && onClose()}
      title={employee ? 'Transfer / update employee' : 'Assign Employee'}
      description="Employee records remain in HRMS. Transfers preserve attendance and payroll history."
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <PeopleSelect
          label="Employee"
          value={person}
          currentName={employee?.name}
          onChange={setPerson}
          required
          disabled={Boolean(employee)}
        />
        <DepartmentField label="Department">
          <select
            aria-label="Target Department"
            required
            className={input}
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          >
            <option value="">Choose department</option>
            {(options.data || [])
              .filter((row) => row.status === 'ACTIVE')
              .map((row) => (
                <option key={row._id} value={row.id}>
                  {row.name}
                </option>
              ))}
          </select>
        </DepartmentField>
        <DepartmentField label="Designation *">
          <input
            aria-label="Employee Designation"
            list="department-designation-options"
            required
            maxLength={120}
            className={input}
            value={designation}
            onChange={(event) => setDesignation(event.target.value)}
          />
          <datalist id="department-designation-options">
            {(designations.data || []).map((row) => (
              <option key={row._id} value={row.title} />
            ))}
          </datalist>
        </DepartmentField>
        <PeopleSelect
          label="Employee Reporting Manager"
          value={manager}
          currentName={employee?.profile?.manager?.name}
          onChange={setManager}
        />
        {save.isError && (
          <p role="alert" className="text-xs text-red-700 sm:col-span-2">
            {errorText(save.error)}
          </p>
        )}
        {options.isError && (
          <p role="alert" className="text-xs text-red-700">
            {errorText(options.error)}
          </p>
        )}
        <div className="flex justify-end gap-3 sm:col-span-2">
          <Button
            type="button"
            variant="secondary"
            disabled={save.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={
              !person ||
              !destination ||
              !designation.trim() ||
              save.isPending ||
              options.isPending
            }
          >
            {save.isPending ? 'Saving...' : 'Save Assignment'}
          </Button>
        </div>
      </form>
    </HRMSDialog>
  );
}
