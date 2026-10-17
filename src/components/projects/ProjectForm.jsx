import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useDebounced } from '../crm/CRMShared.jsx';
import HRMSDialog from '../hrms/HRMSDialog.jsx';
import { api } from '../../services/api.js';
import {
  financeInput as input,
  financeButton as button,
  day,
  has,
  label,
} from '../finance/FinanceShared.jsx';
export default function ProjectForm({
  mode,
  project,
  row,
  metadata: initialMetadata,
  onClose,
}) {
  const editing = Boolean(row?._id);
  const permissions = initialMetadata.permissions || [];
  const [values, setValues] = useState(() =>
    mode === 'project'
      ? {
          title: row?.title || '',
          clientRef: row?.clientRef?._id || '',
          projectType: row?.projectType || 'Client Project',
          primaryDepartment: row?.primaryDepartment?._id || '',
          projectManager:
            row?.projectManager?._id || row?.assignedTo?._id || '',
          service: row?.service || '',
          startDate: day(row?.startDate),
          expectedStartDate: day(row?.expectedStartDate),
          deadline: day(row?.deadline),
          priority: row?.priority || 'MEDIUM',
          billingType: row?.billingType || 'ONE_TIME',
          ...(has(permissions, 'projects.financials.view')
            ? { amount: row?.amount || 0 }
            : {}),
          description: row?.description || '',
          scopeOfWork: row?.scopeOfWork || '',
          lead: row?.lead?._id || '',
          quotation: row?.quotation?._id || '',
          collaboratingDepartments:
            row?.collaboratingDepartments?.map((d) => d._id) || [],
          tags: row?.tags || [],
          ...(editing ? { revision: row.revision } : {}),
        }
      : mode === 'team'
        ? {
            employee: row?.employee?._id || '',
            roleInProject: row?.roleInProject || 'Contributor',
            allocationPercentage: row?.allocationPercentage ?? 100,
          }
        : mode === 'task'
          ? {
              title: row?.title || '',
              description: row?.description || '',
              assignedTo: row?.assignedTo?._id || '',
              priority: row?.priority || 'MEDIUM',
              startDate: day(row?.startDate),
              dueDate: day(row?.dueDate),
              estimatedHours: row?.estimatedHours || 0,
              actualHours: row?.actualHours || 0,
              dependsOn: row?.dependsOn || [],
              status: row?.status || 'TODO',
              ...(editing ? { version: row.version } : {}),
            }
          : mode === 'milestone'
            ? {
                title: row?.title || '',
                description: row?.description || '',
                dueDate: day(row?.dueDate),
                status: row?.status || 'PENDING',
                progress: row?.progress || 0,
                ...(editing ? { revision: row.revision } : {}),
              }
            : mode === 'status'
              ? {
                  status:
                    project.status === 'COMPLETED' ||
                    project.status === 'CANCELLED'
                      ? 'ONGOING'
                      : project.status === 'UPCOMING'
                        ? 'PLANNING'
                        : project.status === 'ONGOING'
                          ? 'REVIEW'
                          : project.status === 'REVIEW'
                            ? 'COMPLETED'
                            : 'ONGOING',
                  revision: project.revision,
                  completionNotes: '',
                  deliveryNotes: '',
                }
              : mode === 'note'
                ? { content: '' }
                : { category: 'Documents' },
  );
  const [directorySearch, setDirectorySearch] = useState('');
  const debouncedSearch = useDebounced(directorySearch);
  const directory = useQuery({
    queryKey: ['projects', 'directory', debouncedSearch, values.clientRef],
    queryFn: () =>
      api
        .get('/projects/metadata', {
          params: {
            search: debouncedSearch,
            ...(values.clientRef ? { client: values.clientRef } : {}),
          },
        })
        .then((r) => r.data.data),
    enabled:
      ['project', 'team'].includes(mode) &&
      (Boolean(debouncedSearch) || Boolean(values.clientRef)),
  });
  const metadata = {
    ...initialMetadata,
    ...directory.data,
    permissions,
    tasks: initialMetadata.tasks,
  };
  const [error, setError] = useState('');
  const [file, setFile] = useState();
  const cache = useQueryClient();
  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }));
  const save = useMutation({
    mutationFn: async () => {
      let url,
        method = 'post',
        body = { ...values };
      if (mode === 'project') {
        z.object({
          title: z.string().min(2),
          primaryDepartment: z.string().min(1),
          projectManager: z.string().min(1),
          deadline: z.string().min(1),
        }).parse(body);
        if (body.projectType !== 'Internal Project' && !body.clientRef)
          throw new Error('Select a client for client work');
        if (
          (body.startDate || body.expectedStartDate) &&
          body.deadline < (body.startDate || body.expectedStartDate)
        )
          throw new Error('Deadline must follow the start date');
        url = editing ? `/projects/${row._id}` : '/projects';
        method = editing ? 'patch' : 'post';
      } else {
        const base = `/projects/${project._id}`;
        url =
          mode === 'task'
            ? `${base}/tasks${editing ? `/${row._id}` : ''}`
            : mode === 'milestone'
              ? `${base}/milestones${editing ? `/${row._id}` : ''}`
              : mode === 'team'
                ? `${base}/team${editing ? `/${row._id}` : ''}`
                : mode === 'status'
                  ? `${base}/status`
                  : mode === 'note'
                    ? `${base}/notes`
                    : `${base}/files`;
        method = mode === 'status' || editing ? 'patch' : 'post';
        if (['task', 'milestone'].includes(mode))
          z.object({ title: z.string().min(2) }).parse(body);
        if (mode === 'file') {
          if (!file) throw new Error('Choose a file');
          body = new FormData();
          body.append('file', file);
          body.append('category', values.category);
        }
      }
      return api[method](url, body);
    },
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
    onError: (e) =>
      setError(
        e.response?.data?.error?.message || e.issues?.[0]?.message || e.message,
      ),
  });
  const field = (key, title, type = 'text', required = false) => (
    <label key={key} className="space-y-1 text-xs text-[#55709a]">
      <span>
        {title}
        {required ? ' *' : ''}
      </span>
      {type === 'textarea' ? (
        <textarea
          className={`${input} min-h-24`}
          value={values[key] || ''}
          maxLength={key === 'scopeOfWork' ? 10000 : 5000}
          onChange={(e) => set(key, e.target.value)}
        />
      ) : (
        <input
          className={input}
          type={type}
          required={required}
          min={type === 'number' ? 0 : undefined}
          max={key === 'allocationPercentage' ? 100 : undefined}
          step={type === 'number' ? '0.01' : undefined}
          value={values[key] ?? ''}
          onChange={(e) =>
            set(
              key,
              type === 'number' ? Number(e.target.value) : e.target.value,
            )
          }
        />
      )}
    </label>
  );
  const select = (key, title, options, required = false) => (
    <label key={key} className="space-y-1 text-xs text-[#55709a]">
      <span>
        {title}
        {required ? ' *' : ''}
      </span>
      <select
        className={input}
        required={required}
        value={values[key] || ''}
        onChange={(e) => set(key, e.target.value)}
      >
        <option value="">Select {title.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o._id || o} value={o._id || o}>
            {o.name ||
              o.companyName ||
              o.quotationNumber ||
              o.leadId ||
              label(o)}
          </option>
        ))}
      </select>
    </label>
  );
  const members = [
    ...(project?.teamMembers || [])
      .filter((m) => m.status === 'ACTIVE')
      .map((m) => m.employee),
    project?.projectManager || project?.assignedTo,
  ].filter(Boolean);
  const flow = {
    UPCOMING: ['PLANNING', 'ONGOING', 'CANCELLED'],
    PLANNING: ['ONGOING', 'ON_HOLD', 'CANCELLED'],
    ONGOING: ['REVIEW', 'ON_HOLD', 'CANCELLED'],
    ON_HOLD: ['PLANNING', 'ONGOING', 'CANCELLED'],
    REVIEW: ['ONGOING', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
    COMPLETED: ['ONGOING'],
    CANCELLED: ['PLANNING'],
  };
  return (
    <HRMSDialog
      open
      onOpenChange={onClose}
      title={`${editing ? 'Edit' : 'Add'} ${label(mode === 'status' ? 'project status' : mode)}`}
      description="Changes are saved to live ERP records."
      wide={mode === 'project'}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          save.mutate();
        }}
        className="space-y-4"
      >
        {['project', 'team'].includes(mode) && (
          <label className="block text-xs text-slate-500">
            Search ERP clients and employees
            <input
              className={input}
              value={directorySearch}
              placeholder="Search name or company..."
              onChange={(e) => setDirectorySearch(e.target.value)}
            />
          </label>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mode === 'project' && (
            <>
              {field('title', 'Project name', 'text', true)}
              {select(
                'projectType',
                'Project type',
                [
                  'Client Project',
                  'Internal Project',
                  'Website Development',
                  'Web Application',
                  'Software Development',
                  'SEO',
                  'Social Media',
                  'Branding',
                  'Graphic Design',
                  'Video Production',
                  'Marketing Campaign',
                  'Other',
                ],
                true,
              )}
              {select(
                'clientRef',
                'Client',
                metadata.clients,
                values.projectType !== 'Internal Project',
              )}
              {select('service', 'Service', metadata.services)}
              {select(
                'primaryDepartment',
                'Primary department',
                metadata.departments,
                true,
              )}
              {select(
                'projectManager',
                'Project manager',
                metadata.users,
                true,
              )}
              {field('expectedStartDate', 'Expected start', 'date')}
              {field('startDate', 'Start date', 'date')}
              {field('deadline', 'Deadline', 'date', true)}
              {select(
                'priority',
                'Priority',
                ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
                true,
              )}
              {has(permissions, 'projects.financials.view') && (
                <>
                  {field('amount', 'Budget', 'number')}
                  {select('billingType', 'Billing type', [
                    'ONE_TIME',
                    'MONTHLY',
                    'QUARTERLY',
                    'YEARLY',
                  ])}
                </>
              )}
              {select(
                'lead',
                'Optional lead',
                metadata.leads.filter(
                  (l) =>
                    !values.clientRef ||
                    metadata.clients.find((c) => c._id === values.clientRef)
                      ?.originatingLead === l._id,
                ),
              )}
              {select(
                'quotation',
                'Optional accepted quotation',
                metadata.quotations.filter(
                  (q) => q.clientRef === values.clientRef,
                ),
              )}
              <label className="text-xs">
                Collaborating departments
                <select
                  multiple
                  className={`${input} min-h-24`}
                  value={values.collaboratingDepartments}
                  onChange={(e) =>
                    set(
                      'collaboratingDepartments',
                      Array.from(e.target.selectedOptions, (o) => o.value),
                    )
                  }
                >
                  {metadata.departments
                    .filter((d) => d._id !== values.primaryDepartment)
                    .map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </label>
              {field('description', 'Description', 'textarea')}
              {field('scopeOfWork', 'Scope of work', 'textarea')}
              <label className="text-xs">
                Tags, comma separated
                <input
                  className={input}
                  value={values.tags.join(', ')}
                  onChange={(e) =>
                    set(
                      'tags',
                      e.target.value.split(',').map((s) => s.trim()),
                    )
                  }
                />
              </label>
            </>
          )}
          {mode === 'team' && (
            <>
              {select('employee', 'Employee', metadata.users, true)}
              {field('roleInProject', 'Role in project', 'text', true)}
              {field('allocationPercentage', 'Allocation %', 'number', true)}
            </>
          )}
          {mode === 'task' && (
            <>
              {field('title', 'Task title', 'text', true)}
              {select('assignedTo', 'Assignee', members)}
              {select(
                'priority',
                'Priority',
                ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
                true,
              )}
              {select(
                'status',
                'Status',
                ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED'],
                true,
              )}
              {field('startDate', 'Start date', 'date')}
              {field('dueDate', 'Due date', 'date')}
              {field('estimatedHours', 'Estimated hours', 'number')}
              {field('actualHours', 'Recorded hours', 'number')}
              {field('description', 'Description', 'textarea')}
              <label className="text-xs">
                Dependencies
                <select
                  multiple
                  className={`${input} min-h-24`}
                  value={values.dependsOn}
                  onChange={(e) =>
                    set(
                      'dependsOn',
                      Array.from(e.target.selectedOptions, (o) => o.value),
                    )
                  }
                >
                  {(metadata.tasks || [])
                    .filter((t) => t._id !== row?._id)
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.title}
                      </option>
                    ))}
                </select>
              </label>
            </>
          )}
          {mode === 'milestone' && (
            <>
              {field('title', 'Milestone title', 'text', true)}
              {field('dueDate', 'Due date', 'date', true)}
              {field('progress', 'Progress %', 'number')}
              {select(
                'status',
                'Status',
                ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
                true,
              )}
              {field('description', 'Description', 'textarea')}
            </>
          )}
          {mode === 'status' && (
            <>
              {select(
                'status',
                'Next status',
                (flow[project.status] || []).filter((s) =>
                  has(
                    permissions,
                    `projects.${s === 'COMPLETED' ? 'complete' : ['COMPLETED', 'CANCELLED'].includes(project.status) ? 'reopen' : 'change_status'}`,
                  ),
                ),
                true,
              )}
              {field('completionNotes', 'Completion notes', 'textarea')}
              {field('deliveryNotes', 'Delivery notes', 'textarea')}
            </>
          )}
          {mode === 'note' && field('content', 'Comment', 'textarea', true)}
          {mode === 'file' && (
            <>
              {select(
                'category',
                'Category',
                [
                  'Requirements',
                  'Brief',
                  'Designs',
                  'Documents',
                  'Deliverables',
                  'Client Files',
                  'Internal Files',
                  'Other',
                ],
                true,
              )}
              <label className="text-xs">
                PDF, PNG or JPEG
                <input
                  className={input}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  required
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
            </>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button className={button} disabled={save.isPending}>
          {save.isPending ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </HRMSDialog>
  );
}
