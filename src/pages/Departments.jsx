import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  UsersRound,
  UserRound,
  CodeXml,
  Megaphone,
  Palette,
  Video,
  ChartNoAxesCombined,
  Folder,
  Plus,
  MoreVertical,
  ArrowRight,
  Search,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { Button } from '../components/ui/Button.jsx';
import {
  DepartmentForm,
  useDepartmentMutation,
} from '../components/hrms/DepartmentForms.jsx';
import { canDepartment, errorText } from '../services/departmentService.js';
import { useDebounced, Pager } from '../components/crm/CRMShared.jsx';
import '../styles/departments.css';
const visuals = {
  social_media: [Megaphone, 'pink'],
  web_dev: [CodeXml, 'blue'],
  graphics: [Palette, 'orange'],
  video_editing: [Video, 'purple'],
  seo: [ChartNoAxesCombined, 'green'],
};
export function DepartmentBadge({ status }) {
  return (
    <span
      className={`department-badge ${status === 'ACTIVE' ? 'active' : 'inactive'}`}
    >
      <i />
      {status === 'ACTIVE' ? 'Active' : 'Inactive'}
    </span>
  );
}
export function DepartmentQueryState({ query, empty, children }) {
  if (query.isPending)
    return (
      <div role="status" className="grid gap-4 py-5 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
        <span className="sr-only">Loading departments</span>
      </div>
    );
  if (query.isError)
    return (
      <div
        role="alert"
        className="rounded-xl bg-red-50 p-5 text-sm text-red-700"
      >
        {errorText(query.error)}
        <button className="ml-3 underline" onClick={() => query.refetch()}>
          Retry
        </button>
      </div>
    );
  return empty ? (
    <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
      {empty}
    </p>
  ) : (
    children
  );
}
export default function Departments() {
  const user = useAuthStore((state) => state.user);
  const allowed = canDepartment(user, 'departments.view');
  const [search, setSearch] = useState('');
  const term = useDebounced(search);
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');
  const query = useQuery({
    queryKey: ['departments', 'management', term, status, sort, page],
    queryFn: async ({ signal }) =>
      (
        await api.get('/departments', {
          params: { search: term, ...(status ? { status } : {}), sort, page },
          signal,
        })
      ).data.data,
    enabled: allowed,
    staleTime: 30000,
  });
  const change = useDepartmentMutation(
    async (row) =>
      (
        await api.patch(`/departments/${row._id}/status`, {
          status: row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
        })
      ).data,
    () =>
      setSuccess('Department status updated. Employee history is preserved.'),
  );
  if (!allowed)
    return (
      <p role="alert" className="p-6 text-sm text-slate-600">
        You do not have permission to manage departments.
      </p>
    );
  const summary = query.data?.summary;
  return (
    <div className="department-page">
      <header className="department-page-heading">
        <div>
          <h1>Departments</h1>
          <p>Manage company departments, teams and reporting structure.</p>
        </div>
        {canDepartment(user, 'departments.create') && (
          <Button onClick={() => setCreating(true)}>
            <Plus size={18} />
            Add Department
          </Button>
        )}
      </header>
      <div className="department-summary">
        {[
          ['Total Departments', summary?.total, Building2, 'blue'],
          ['Active Departments', summary?.active, UsersRound, 'green'],
          ['Total Employees', summary?.employees, UsersRound, 'purple'],
          ['Team Leads', summary?.teamLeads, UserRound, 'orange'],
        ].map(([label, value, Icon, tone]) => (
          <article key={label}>
            <span className={`department-icon ${tone}`}>
              <Icon size={29} />
            </span>
            <div>
              <p>{label}</p>
              <strong>{value ?? '-'}</strong>
              <small>Live records</small>
            </div>
          </article>
        ))}
      </div>
      <div className="department-filters">
        <label className="department-search">
          <Search size={20} />
          <input
            aria-label="Search Departments"
            maxLength={100}
            placeholder="Search departments..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Status
          <select
            aria-label="Department status filter"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All Departments</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <label>
          Sort by
          <select
            aria-label="Sort departments"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="name">Name (A - Z)</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>
      {success && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800"
        >
          {success}
        </p>
      )}
      {change.isError && (
        <p role="alert" className="mb-4 text-xs text-red-700">
          {errorText(change.error)}
        </p>
      )}
      <DepartmentQueryState
        query={query}
        empty={
          query.data && !query.data.items.length
            ? 'No departments found.'
            : null
        }
      >
        <div className="department-cards">
          {query.data?.items.map((row) => {
            const [Icon, tone] = visuals[row.key] || [Building2, 'blue'];
            return (
              <article key={row._id} className="department-card">
                <div className="department-card-heading">
                  <span className={`department-icon ${tone}`}>
                    <Icon size={30} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2>{row.name}</h2>
                    <span className="department-code">{row.code}</span>
                  </div>
                  <DepartmentBadge status={row.status} />
                  {canDepartment(user, 'departments.edit') && (
                    <details className="department-card-menu">
                      <summary aria-label={`Actions for ${row.name}`}>
                        <MoreVertical size={19} />
                      </summary>
                      <div>
                        <button onClick={() => setEditing(row)}>Edit</button>
                        <Link to={`/departments/${row._id}?tab=employees`}>
                          Manage Employees
                        </Link>
                        <button
                          disabled={change.isPending}
                          onClick={() => change.mutate(row)}
                        >
                          {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </details>
                  )}
                </div>
                <div className="department-card-counts">
                  <div>
                    <UsersRound size={24} />
                    <span>
                      <strong>{row.employeeCount}</strong>
                      <small>Employees</small>
                    </span>
                  </div>
                  <div>
                    <Folder size={24} />
                    <span>
                      <strong>{row.activeProjects}</strong>
                      <small>Active Projects</small>
                    </span>
                  </div>
                </div>
                <footer>
                  <span className={`department-head-avatar ${tone}`}>
                    {row.departmentHead?.name
                      ?.split(' ')
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join('') || '-'}
                  </span>
                  <div>
                    <small>HOD</small>
                    <p>{row.departmentHead?.name || 'Not assigned'}</p>
                  </div>
                  <Link to={`/departments/${row._id}`}>
                    View Department
                    <ArrowRight size={17} />
                  </Link>
                </footer>
              </article>
            );
          })}
        </div>
        <Pager
          page={page}
          pagination={query.data?.pagination}
          onPage={setPage}
        />
      </DepartmentQueryState>
      {(creating || editing) && (
        <DepartmentForm
          department={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() =>
            setSuccess(
              editing
                ? 'Department updated.'
                : 'Department created. Create another or assign employees from its detail page.',
            )
          }
        />
      )}
    </div>
  );
}
