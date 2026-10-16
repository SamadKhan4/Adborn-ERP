import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Pencil,
  Plus,
  UsersRound,
  CalendarCheck2,
  Palmtree,
  UserX,
  Folder,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { Button } from '../components/ui/Button.jsx';
import {
  DepartmentForm,
  DepartmentMembershipForm,
  useDepartmentMutation,
} from '../components/hrms/DepartmentForms.jsx';
import { DepartmentBadge, DepartmentQueryState } from './Departments.jsx';
import {
  canDepartment,
  dateText,
  errorText,
  pretty,
} from '../services/departmentService.js';
import { Pager, useDebounced } from '../components/crm/CRMShared.jsx';
import '../styles/departments.css';
export default function DepartmentDetail() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = ['overview', 'employees', 'projects', 'activity'].includes(
    params.get('tab'),
  )
    ? params.get('tab')
    : 'overview';
  const user = useAuthStore((state) => state.user);
  const allowed = canDepartment(user, 'departments.view');
  const analytics = canDepartment(user, 'departments.view_analytics');
  const [editing, setEditing] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const term = useDebounced(search);
  const [active, setActive] = useState('');
  const [success, setSuccess] = useState('');
  const query = useQuery({
    queryKey: ['department', id],
    queryFn: async ({ signal }) =>
      (await api.get(`/departments/${id}`, { signal })).data.data,
    enabled: allowed,
  });
  const summary = useQuery({
    queryKey: ['department', id, 'summary'],
    queryFn: async ({ signal }) =>
      (await api.get(`/departments/${id}/summary`, { signal })).data.data,
    enabled: allowed && analytics,
    refetchInterval: 60000,
  });
  const records = useQuery({
    queryKey: ['department', id, tab, page, term, active],
    queryFn: async ({ signal }) =>
      (
        await api.get(`/departments/${id}/${tab}`, {
          params: {
            page,
            search: term,
            ...(tab === 'employees' && active ? { active } : {}),
          },
          signal,
        })
      ).data.data,
    enabled: allowed && tab !== 'overview' && (tab !== 'projects' || analytics),
  });
  const status = useDepartmentMutation(
    async () =>
      (
        await api.patch(`/departments/${id}/status`, {
          status: query.data.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
        })
      ).data,
    () => setSuccess('Status updated. Historical records remain intact.'),
  );
  if (!allowed)
    return (
      <p role="alert">You do not have permission to manage this department.</p>
    );
  const department = query.data;
  const totals = summary.data;
  const tabs = [
    ['overview', 'Overview'],
    ['employees', 'Employees'],
    ...(analytics ? [['projects', 'Projects']] : []),
    ['activity', 'Activity'],
  ];
  const changedTab = (value) => {
    setParams({ tab: value });
    setPage(1);
    setSearch('');
    setActive('');
  };
  return (
    <div className="department-page">
      <Link
        to="/departments"
        className="mb-4 inline-flex items-center gap-2 text-xs text-sky-700"
      >
        <ArrowLeft size={15} />
        All Departments
      </Link>
      <DepartmentQueryState query={query}>
        {department && (
          <>
            <header className="department-page-heading">
              <div>
                <h1>{department.name}</h1>
                <p>
                  {department.code} / {department.departmentId}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <DepartmentBadge status={department.status} />
                  <span className="text-xs text-slate-500">
                    HOD: {department.departmentHead?.name || 'Not assigned'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {canDepartment(user, 'departments.edit') && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil size={15} />
                      Edit Department
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={status.isPending}
                      onClick={() => status.mutate()}
                    >
                      {department.status === 'ACTIVE'
                        ? 'Deactivate'
                        : 'Activate'}
                    </Button>
                  </>
                )}
                {canDepartment(user, 'departments.manage_members') && (
                  <Button
                    disabled={department.status !== 'ACTIVE'}
                    onClick={() => {
                      changedTab('employees');
                      setAssignment({});
                    }}
                  >
                    <Plus size={16} />
                    Manage Employees
                  </Button>
                )}
              </div>
            </header>
            {success && (
              <p
                role="status"
                className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800"
              >
                {success}
              </p>
            )}
            {status.isError && (
              <p role="alert" className="mb-4 text-xs text-red-700">
                {errorText(status.error)}
              </p>
            )}
            {analytics && (
              <>
                {summary.isError ? (
                  <p role="alert" className="mb-4 text-xs text-red-700">
                    {errorText(summary.error)}
                    <button
                      className="ml-2 underline"
                      onClick={() => summary.refetch()}
                    >
                      Retry analytics
                    </button>
                  </p>
                ) : (
                  <div className="department-summary detail">
                    {[
                      ['Total Employees', totals?.employees, UsersRound],
                      ['Present Today', totals?.present, CalendarCheck2],
                      ['On Leave', totals?.onLeave, Palmtree],
                      ['Absent', totals?.absent, UserX],
                      [
                        'Active Projects',
                        totals?.projects?.Active || 0,
                        Folder,
                      ],
                    ].map(([label, value, Icon]) => (
                      <article key={label}>
                        <span className="department-icon blue">
                          <Icon size={24} />
                        </span>
                        <div>
                          <p>{label}</p>
                          <strong>
                            {summary.isPending ? '-' : (value ?? 0)}
                          </strong>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
            <nav aria-label="Department tabs" className="department-tabs">
              {tabs.map(([key, label]) => (
                <button
                  key={key}
                  aria-current={tab === key ? 'page' : undefined}
                  onClick={() => changedTab(key)}
                >
                  {label}
                </button>
              ))}
            </nav>
            {tab === 'overview' ? (
              <section className="department-panel">
                <h2>Department Overview</h2>
                <dl className="department-overview-fields">
                  {[
                    ['Department ID', department.departmentId],
                    ['Department Name', department.name],
                    ['Code', department.code],
                    ['Department Head', department.departmentHead?.name],
                    ['Reporting Manager', department.reportingManager?.name],
                    ['Parent Department', department.parentDepartment?.name],
                    ['Location', department.location],
                    ['Status', department.status],
                    ['Created Date', dateText(department.createdAt)],
                    ['Description', department.description],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value || '-'}</dd>
                    </div>
                  ))}
                </dl>
                {totals && (
                  <div className="mt-5 rounded-xl bg-sky-50 p-4 text-xs text-sky-900">
                    <p>
                      Late today: {totals.late} / Work from home: {totals.wfh} /
                      Completed projects: {totals.projects?.Completed || 0}
                    </p>
                    <p className="mt-2 text-slate-500">{totals.basis}</p>
                  </div>
                )}
              </section>
            ) : tab === 'projects' && !analytics ? (
              <p role="alert">You do not have analytics permission.</p>
            ) : (
              <section className="department-panel">
                <div className="department-table-tools">
                  <h2>{tabs.find(([key]) => key === tab)?.[1]}</h2>
                  {tab !== 'activity' && (
                    <input
                      aria-label={`Search department ${tab}`}
                      className="department-table-search"
                      placeholder={
                        tab === 'employees'
                          ? 'Search employee name or email'
                          : 'Search projects'
                      }
                      maxLength={100}
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                      }}
                    />
                  )}
                  {tab === 'employees' && (
                    <select
                      aria-label="Department employee status"
                      value={active}
                      onChange={(event) => {
                        setActive(event.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">All statuses</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  )}
                </div>
                <DepartmentQueryState
                  query={records}
                  empty={
                    records.data && !records.data.items.length
                      ? tab === 'employees'
                        ? 'No employees assigned to this department.'
                        : tab === 'projects'
                          ? 'No projects assigned to department employees.'
                          : 'No department activity yet.'
                      : null
                  }
                >
                  <div className="department-table-scroll">
                    <table>
                      <thead>
                        <tr>
                          {(tab === 'employees'
                            ? [
                                'Employee',
                                'Employee ID',
                                'Designation',
                                'Reporting Manager',
                                'Employment Type',
                                'Joining Date',
                                'Status',
                                'Actions',
                              ]
                            : tab === 'projects'
                              ? [
                                  'Project',
                                  'Status',
                                  'Assigned to',
                                  'Start Date',
                                ]
                              : ['Action', 'Performed by', 'Date', 'Details']
                          ).map((label) => (
                            <th key={label}>{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {records.data?.items.map((row) => (
                          <tr key={row._id}>
                            {tab === 'employees' ? (
                              <>
                                <td>
                                  <strong>{row.name}</strong>
                                  <small>{row.email}</small>
                                </td>
                                <td>{row.profile?.employeeCode || '-'}</td>
                                <td>{row.profile?.designation || '-'}</td>
                                <td>{row.profile?.manager?.name || '-'}</td>
                                <td>{pretty(row.profile?.employmentType)}</td>
                                <td>{dateText(row.profile?.joiningDate)}</td>
                                <td>{row.active ? 'Active' : 'Inactive'}</td>
                                <td>
                                  <div className="flex gap-2">
                                    {[
                                      'super_admin',
                                      'admin',
                                      'manager',
                                      'hr',
                                    ].includes(user.role) && (
                                      <Link
                                        to={`/hrms/employees/${row._id}/monitoring`}
                                      >
                                        View Employee
                                      </Link>
                                    )}
                                    {canDepartment(
                                      user,
                                      'departments.manage_members',
                                    ) && (
                                      <button
                                        onClick={() => setAssignment(row)}
                                      >
                                        Transfer / Manager
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </>
                            ) : tab === 'projects' ? (
                              <>
                                <td>
                                  <strong>{row.title}</strong>
                                  <small>{row.projectId}</small>
                                </td>
                                <td>{row.status}</td>
                                <td>{row.assignee || '-'}</td>
                                <td>{dateText(row.startDate)}</td>
                              </>
                            ) : (
                              <>
                                <td>{pretty(row.action)}</td>
                                <td>{row.user?.name || 'System'}</td>
                                <td>{dateText(row.createdAt)}</td>
                                <td>
                                  {row.details?.designation
                                    ? `Designation: ${row.details.designation}`
                                    : row.details?.changedFields?.length
                                      ? row.details.changedFields.join(', ')
                                      : row.details?.previous
                                        ? `Status: ${row.details.previous} -> ${row.details.current}`
                                        : 'Department updated'}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pager
                    page={page}
                    pagination={records.data?.pagination}
                    onPage={setPage}
                  />
                </DepartmentQueryState>
                {tab === 'projects' && records.data?.basis && (
                  <p className="mt-3 text-xs text-slate-500">
                    {records.data.basis}
                  </p>
                )}
              </section>
            )}
            {editing && (
              <DepartmentForm
                department={department}
                onClose={() => setEditing(false)}
                onSaved={() => setSuccess('Department updated.')}
              />
            )}
            {assignment && (
              <DepartmentMembershipForm
                key={assignment._id || 'new'}
                department={department}
                employee={assignment._id ? assignment : null}
                onClose={() => setAssignment(null)}
                onSaved={() => setSuccess('Employee assignment saved.')}
              />
            )}
          </>
        )}
      </DepartmentQueryState>
    </div>
  );
}
