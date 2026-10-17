import {
  ProjectBars as Bars,
  ProjectDonut as Donut,
} from '../components/projects/ProjectCharts.jsx';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  FolderKanban,
  PlayCircle,
  CalendarDays,
  CheckCircle2,
  Pause,
  TriangleAlert,
  Plus,
  BarChart3,
  Columns3,
  LayoutGrid,
  List,
  Search,
  Download,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useDebounced } from '../components/crm/CRMShared.jsx';
import ProjectForm from '../components/projects/ProjectForm.jsx';
import {
  financePanel as panel,
  financeInput as input,
  financeButton as button,
  FinanceTable as Table,
  has,
  label,
  day,
  money,
} from '../components/finance/FinanceShared.jsx';
const statuses = [
  'UPCOMING',
  'PLANNING',
  'ONGOING',
  'ON_HOLD',
  'REVIEW',
  'COMPLETED',
  'CANCELLED',
];
const colors = {
  UPCOMING: '#8264fa',
  PLANNING: '#57a7ef',
  ONGOING: '#008aff',
  ON_HOLD: '#ffa129',
  REVIEW: '#10b9bd',
  COMPLETED: '#00b975',
  CANCELLED: '#f25b79',
  DELAYED: '#f25b79',
};
function Badge({ value }) {
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold"
      style={{
        background: `${colors[value] || '#087dda'}17`,
        color: colors[value] || '#087dda',
      }}
    >
      {label(value)}
    </span>
  );
}
function Progress({ value = 0 }) {
  return (
    <div className="flex min-w-24 items-center gap-2 text-[10px]">
      <div className="h-1.5 flex-1 rounded-full bg-[#e7eff8]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#008aff] to-[#53baff]"
          style={{ width: `${value}%` }}
        />
      </div>
      {value}%
    </div>
  );
}
function State({ query, children }) {
  if (query.isPending)
    return (
      <p role="status" className={`${panel} animate-pulse py-10`}>
        Loading projects...
      </p>
    );
  if (query.isError)
    return (
      <div role="alert" className={panel}>
        {query.error.response?.data?.error?.message ||
          'Unable to load projects.'}
        <button className={`${button} ml-3`} onClick={() => query.refetch()}>
          Retry
        </button>
      </div>
    );
  return children;
}
const get = (path, params) =>
  api.get(`/projects${path}`, { params }).then((r) => r.data.data);
async function download(path, name, params) {
  const response = await api.get(`/projects${path}`, {
    params,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function ProjectCard({ project: p, onSelect }) {
  return (
    <button
      onClick={() => onSelect(p)}
      className="w-full rounded-xl border border-[#e0edf8] border-l-4 bg-white p-3 text-left shadow-sm"
      style={{ borderLeftColor: colors[p.status] }}
    >
      <p className="text-xs font-bold text-[#10174d]">{p.title}</p>
      <p className="mt-1 text-[10px] text-[#7285a1]">
        {p.clientRef?.companyName || 'Internal project'}
      </p>
      <div className="my-2 flex justify-between gap-2 text-[9px] text-[#527099]">
        <span>{p.projectId}</span>
        <span>{day(p.deadline) || 'No deadline'}</span>
      </div>
      <Progress value={p.progress} />
      <p className="mt-2 text-[9px] text-[#71859a]">
        {p.projectManager?.name || p.assignedTo?.name || 'Unassigned'} ·{' '}
        {p.teamMembers?.filter((m) => m.status === 'ACTIVE').length || 0}{' '}
        members
      </p>
    </button>
  );
}
function Pipeline({ filters, onSelect }) {
  const lanes = ['UPCOMING', 'ONGOING', 'ON_HOLD', 'COMPLETED'];
  const requests = useQueries({
    queries: lanes.map((status) => ({
      queryKey: ['projects', 'pipeline', filters, status],
      queryFn: () => get('', { ...filters, status, page: 1, limit: 4 }),
    })),
  });
  return (
    <section className={panel}>
      <h2 className="mb-4 text-sm font-bold">Project Pipeline / Kanban</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {lanes.map((s, index) => (
          <div key={s} className="space-y-2 rounded-xl bg-[#f0f7fd] p-2">
            <h3
              className="border-l-4 pl-2 text-xs font-semibold"
              style={{ borderColor: colors[s] }}
            >
              {label(s)} ({requests[index].data?.pagination.total ?? 0})
            </h3>
            <State query={requests[index]}>
              {requests[index].data?.items.map((p) => (
                <ProjectCard key={p._id} project={p} onSelect={onSelect} />
              ))}
              {requests[index].data?.pagination.total === 0 && (
                <p className="py-6 text-center text-[10px] text-slate-500">
                  No {label(s).toLowerCase()} projects.
                </p>
              )}
              {requests[index].data?.pagination.total > 4 && (
                <Link
                  className="text-[10px] text-blue-600"
                  to={`/projects?status=${s}`}
                >
                  View all →
                </Link>
              )}
            </State>
          </div>
        ))}
      </div>
    </section>
  );
}
export default function Projects() {
  const user = useAuthStore((s) => s.user);
  const permissions = user?.permissions || [];
  const allowed = (key) =>
    user?.role === 'super_admin' || has(permissions, `projects.${key}`);
  const location = useLocation();
  const segment = location.pathname.replace(/^\/projects\/?/, '').split('/')[0];
  const routeStatus = {
    upcoming: 'UPCOMING',
    ongoing: 'ONGOING',
    completed: 'COMPLETED',
    'on-hold': 'ON_HOLD',
  }[segment];
  const id = /^[a-f\d]{24}$/i.test(segment) ? segment : null;
  const metadata = useQuery({
    queryKey: ['projects', 'metadata'],
    queryFn: () => get('/metadata'),
    enabled: allowed('view'),
  });
  const [form, setForm] = useState(null);
  const [preview, setPreview] = useState(null);
  const taskOptions = useQuery({
    queryKey: ['projects', 'taskOptions', form?.project?._id],
    queryFn: () => get(`/${form.project._id}/tasks`, { limit: 100 }),
    enabled: form?.mode === 'task',
  });
  const [error, setError] = useState('');
  const cache = useQueryClient();
  const meta = metadata.data;
  const act = useMutation({
    mutationFn: ({ path, method = 'delete', body }) =>
      api[method](`/projects${path}`, body),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ['projects'] });
      setError('');
    },
    onError: (e) => setError(e.response?.data?.error?.message || e.message),
  });
  if (!allowed('view'))
    return (
      <p role="alert" className={panel}>
        You don't have permission to access projects.
      </p>
    );
  const openForm = (mode, project, row) => setForm({ mode, project, row });
  return (
    <main className="space-y-4 text-[#10164d]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Project Management
          </h1>
          <p className="mt-1 text-sm text-[#6480aa]">
            Plan, assign, monitor and deliver client and internal projects.
          </p>
        </div>
        <div className="flex gap-2">
          {allowed('reports.view') && (
            <Link className={`${input} w-auto`} to="/projects/reports">
              <BarChart3 size={15} className="mr-2 inline" />
              Reports
            </Link>
          )}
          {allowed('create') && (
            <button className={button} onClick={() => openForm('project')}>
              <Plus size={16} />
              Add Project
            </button>
          )}
        </div>
      </header>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      <State query={metadata}>
        {meta &&
          (id ? (
            <ProjectDetail
              id={id}
              metadata={meta}
              allowed={allowed}
              openForm={openForm}
              act={act}
              download={download}
            />
          ) : segment === 'reports' ? (
            <ProjectReports
              metadata={meta}
              allowed={allowed}
              download={download}
            />
          ) : (
            <ProjectDashboard
              routeStatus={routeStatus}
              metadata={meta}
              openForm={openForm}
              allowed={allowed}
              onSelect={setPreview}
            />
          ))}
      </State>
      {preview && (
        <section className={panel}>
          <button
            className="float-right text-xs text-blue-600"
            onClick={() => setPreview(null)}
          >
            Close
          </button>
          <h2 className="text-lg font-bold">{preview.title}</h2>
          <div className="my-3 grid gap-3 text-xs sm:grid-cols-4">
            <p>{preview.projectId}</p>
            <p>{preview.clientRef?.companyName || 'Internal'}</p>
            <p>{preview.primaryDepartment?.name || 'Unallocated'}</p>
            <p>Deadline: {day(preview.deadline)}</p>
          </div>
          <Progress value={preview.progress} />
          <Link
            className="mt-4 inline-flex items-center gap-2 text-xs text-blue-600"
            to={`/projects/${preview._id}`}
          >
            Open Project 360 <ArrowRight size={14} />
          </Link>
        </section>
      )}
      {form && meta && (
        <ProjectForm
          key={`${form.mode}-${form.row?._id || 'new'}`}
          {...form}
          metadata={{ ...meta, tasks: taskOptions.data?.items || [] }}
          onClose={() => setForm(null)}
        />
      )}
    </main>
  );
}
function ProjectDashboard({
  routeStatus,
  metadata,
  allowed,
  openForm,
  onSelect,
}) {
  const [filters, setFilters] = useState(() => ({
    status:
      routeStatus ||
      new URLSearchParams(window.location.search).get('status') ||
      '',
    page: 1,
    limit: 10,
    search: '',
    department: '',
    manager: '',
    client: '',
    priority: '',
    from: '',
    to: '',
    sort: 'createdAt',
    order: 'desc',
  }));
  const [view, setView] = useState('table');
  const [hidden, setHidden] = useState([]);
  const search = useDebounced(filters.search, 300);
  const params = Object.fromEntries(
    Object.entries({
      ...filters,
      status: routeStatus || filters.status,
      search,
    }).filter(([, v]) => v !== ''),
  );
  const chartFilters = Object.fromEntries(
    Object.entries(params).filter(
      ([k]) => !['page', 'limit', 'status', 'sort', 'order'].includes(k),
    ),
  );
  const projects = useQuery({
    queryKey: ['projects', 'list', params],
    queryFn: () => get('', params),
  });
  const dashboard = useQuery({
    queryKey: ['projects', 'dashboard', chartFilters],
    queryFn: () => get('/dashboard', chartFilters),
  });
  const change = (key, v) =>
    setFilters((s) => ({ ...s, [key]: v, page: key === 'page' ? v : 1 }));
  const d = dashboard.data;
  const counts = Object.fromEntries(
    (d?.status || []).map((r) => [r._id, r.count]),
  );
  const cols = [
    ['projectId', 'Project ID'],
    [
      'title',
      'Project',
      (p) => (
        <Link
          className="font-semibold text-[#087dda]"
          to={`/projects/${p._id}`}
        >
          {p.title}
        </Link>
      ),
    ],
    ['client', 'Client', (p) => p.clientRef?.companyName || 'Internal'],
    [
      'department',
      'Department',
      (p) => p.primaryDepartment?.name || 'Unallocated',
    ],
    [
      'manager',
      'Manager',
      (p) => p.projectManager?.name || p.assignedTo?.name || 'Unassigned',
    ],
    [
      'team',
      'Team',
      (p) => p.teamMembers?.filter((m) => m.status === 'ACTIVE').length || 0,
    ],
    ['progress', 'Progress', (p) => <Progress value={p.progress} />],
    ['startDate', 'Start date', (p) => day(p.startDate || p.expectedStartDate)],
    ['deadline', 'Deadline', (p) => day(p.deadline)],
    ['status', 'Status', (p) => <Badge value={p.status} />],
    ['health', 'Health', (p) => <Badge value={p.health} />],
    ['priority', 'Priority', (p) => <Badge value={p.priority} />],
  ];
  const monthly = [
    ...new Set([
      ...(d?.monthly || []).map((m) => m._id),
      ...(d?.completedMonthly || []).map((m) => m._id),
    ]),
  ]
    .sort()
    .slice(-6)
    .map((month) => ({
      month,
      created: d.monthly.find((m) => m._id === month)?.created || 0,
      completed:
        d.completedMonthly.find((m) => m._id === month)?.completed || 0,
    }));
  return (
    <>
      <State query={dashboard}>
        {d && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {[
                ['Total Projects', d.total, FolderKanban, '#008aff'],
                [
                  'Ongoing Projects',
                  counts.ONGOING || 0,
                  PlayCircle,
                  '#00b975',
                ],
                [
                  'Upcoming Projects',
                  counts.UPCOMING || 0,
                  CalendarDays,
                  '#8264fa',
                ],
                [
                  'Completed Projects',
                  counts.COMPLETED || 0,
                  CheckCircle2,
                  '#00b975',
                ],
                ['On Hold Projects', counts.ON_HOLD || 0, Pause, '#f25b79'],
                ['Delayed Projects', d.delayedCount, TriangleAlert, '#f25b79'],
              ].map(([title, n, Icon, color]) => (
                <button
                  key={title}
                  onClick={() =>
                    change(
                      'status',
                      title.startsWith('Total')
                        ? ''
                        : title.startsWith('Delayed')
                          ? 'DELAYED'
                          : title.startsWith('On Hold')
                            ? 'ON_HOLD'
                            : title.split(' ')[0].toUpperCase(),
                    )
                  }
                  className={`${panel} flex items-center gap-4 text-left !p-4`}
                >
                  <span
                    className="rounded-xl p-3"
                    style={{ background: `${color}14`, color }}
                  >
                    <Icon size={24} />
                  </span>
                  <div>
                    <p className="text-[10px] text-[#6880a8]">{title}</p>
                    <p className="mt-1 text-2xl font-bold">{n}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-4">
              <section className={panel}>
                <h2 className="mb-3 text-sm font-bold">Project Status</h2>
                <Donut
                  data={d.status.map((s) => ({
                    name: label(s._id),
                    value: s.count,
                  }))}
                  total={d.total}
                />
              </section>
              <section className={panel}>
                <h2 className="mb-3 text-sm font-bold">
                  Projects by Department
                </h2>
                <Bars
                  data={d.departments.map((r) => ({
                    name: r.name,
                    projects: r.count,
                  }))}
                  series={['projects']}
                />
              </section>
              <section className={panel}>
                <h2 className="mb-3 text-sm font-bold">Monthly Progress</h2>
                {monthly.length ? (
                  <ResponsiveContainer width="100%" height={205}>
                    <AreaChart data={monthly}>
                      <CartesianGrid vertical={false} stroke="#edf3f8" />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Area
                        dataKey="created"
                        stroke="#008aff"
                        fill="#008aff25"
                      />
                      <Area
                        dataKey="completed"
                        stroke="#00b975"
                        fill="#00b97525"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-12 text-xs text-slate-500">
                    No project history yet.
                  </p>
                )}
                <p className="text-[9px] text-slate-500">
                  Created and completed by actual event month.
                </p>
              </section>
              <section className={panel}>
                <h2 className="mb-4 text-sm font-bold">Project Timeline</h2>
                {d.timeline.map((t) => (
                  <div
                    key={t._id}
                    className="flex justify-between border-b border-[#edf3f8] py-3 text-xs"
                  >
                    <span>{t._id}</span>
                    <b>{t.count}</b>
                  </div>
                ))}
                {!d.timeline.length && (
                  <p className="text-xs text-slate-500">No active deadlines.</p>
                )}
              </section>
            </div>
          </>
        )}
      </State>
      <section className={panel}>
        <div className="mb-4 flex flex-wrap gap-2 border-b border-[#e6eef8] pb-3">
          {[
            ['', 'All'],
            ...[
              'ONGOING',
              'UPCOMING',
              'ON_HOLD',
              'REVIEW',
              'COMPLETED',
              'CANCELLED',
              'DELAYED',
            ].map((s) => [s, label(s)]),
          ].map(([s, title]) => (
            <Link
              key={s}
              to="/projects"
              onClick={() => change('status', s)}
              className={`rounded-lg px-3 py-2 text-[11px] ${params.status === s || (!params.status && !s) ? 'bg-[#eaf5ff] text-[#008aff]' : 'text-[#5d749a]'}`}
            >
              {title} (
              {s === 'DELAYED'
                ? d?.delayedCount || 0
                : s
                  ? counts[s] || 0
                  : d?.total || 0}
              )
            </Link>
          ))}
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <label className="relative">
            <Search
              className="absolute left-3 top-3 text-[#6a8bb3]"
              size={14}
            />
            <input
              className={`${input} pl-9`}
              value={filters.search}
              placeholder="Search projects, project ID..."
              onChange={(e) => change('search', e.target.value)}
            />
          </label>
          {[
            ['department', 'Department', metadata.departments],
            ['manager', 'Manager', metadata.users],
            ['client', 'Client', metadata.clients],
          ].map(([key, title, options]) => (
            <select
              key={key}
              aria-label={title}
              className={input}
              value={filters[key]}
              onChange={(e) => change(key, e.target.value)}
            >
              <option value="">All {title}s</option>
              {options.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.name || o.companyName}
                </option>
              ))}
            </select>
          ))}
          <select
            aria-label="Priority"
            className={input}
            value={filters.priority}
            onChange={(e) => change('priority', e.target.value)}
          >
            <option value="">All priorities</option>
            {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <button
            className={input}
            onClick={() =>
              setFilters({
                page: 1,
                limit: 10,
                search: '',
                status: '',
                department: '',
                manager: '',
                client: '',
                priority: '',
                from: '',
                to: '',
                sort: 'createdAt',
                order: 'desc',
              })
            }
          >
            Clear filters
          </button>
          <label className="text-[10px] text-slate-500">
            Start date from
            <input
              aria-label="Start date from"
              className={input}
              type="date"
              value={filters.from}
              onChange={(e) => change('from', e.target.value)}
            />
          </label>
          <label className="text-[10px] text-slate-500">
            Start date to
            <input
              aria-label="Start date to"
              className={input}
              type="date"
              value={filters.to}
              onChange={(e) => change('to', e.target.value)}
            />
          </label>
          <select
            aria-label="Sort projects"
            className={input}
            value={filters.sort}
            onChange={(e) => change('sort', e.target.value)}
          >
            {['createdAt', 'title', 'deadline', 'startDate', 'priority'].map(
              (s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ),
            )}
          </select>
          <button
            className={input}
            onClick={() =>
              change('order', filters.order === 'asc' ? 'desc' : 'asc')
            }
          >
            {filters.order === 'asc' ? 'Ascending' : 'Descending'}
          </button>
          <select
            aria-label="Rows per page"
            className={input}
            value={filters.limit}
            onChange={(e) => change('limit', Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} rows
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            {[
              ['table', List],
              ['grid', LayoutGrid],
            ].map(([key, Icon]) => (
              <button
                aria-label={`${key} view`}
                className={`${input} !w-auto ${view === key ? 'text-blue-600' : ''}`}
                key={key}
                onClick={() => setView(key)}
              >
                <Icon size={16} />
              </button>
            ))}
            <details className="relative text-xs">
              <summary className="cursor-pointer">
                <Columns3 size={16} />
              </summary>
              <div className={`${panel} absolute right-0 z-10 w-48 space-y-2`}>
                {cols.map(([key, title]) => (
                  <label key={key} className="block">
                    <input
                      type="checkbox"
                      checked={!hidden.includes(key)}
                      onChange={() =>
                        setHidden((v) =>
                          v.includes(key)
                            ? v.filter((k) => k !== key)
                            : [...v, key],
                        )
                      }
                    />{' '}
                    {title}
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>
        <State query={projects}>
          {view === 'table' ? (
            <Table
              columns={cols.filter(([k]) => !hidden.includes(k))}
              items={projects.data?.items || []}
              pagination={projects.data?.pagination}
              onPage={(p) => change('page', p)}
              actions={(p) => (
                <>
                  <Link to={`/projects/${p._id}`}>View</Link>
                  {allowed('edit') &&
                    !['COMPLETED', 'CANCELLED'].includes(p.status) && (
                      <button onClick={() => openForm('project', p, p)}>
                        Edit
                      </button>
                    )}
                </>
              )}
              empty="No projects match these filters."
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {projects.data?.items.map((p) => (
                  <ProjectCard key={p._id} project={p} onSelect={onSelect} />
                ))}
              </div>
              <Table
                columns={[]}
                items={[]}
                pagination={projects.data?.pagination}
                onPage={(p) => change('page', p)}
                empty={
                  projects.data?.items.length
                    ? ''
                    : 'No projects match these filters.'
                }
              />
            </>
          )}
        </State>
      </section>
      <Pipeline filters={chartFilters} onSelect={onSelect} />
      <div className="grid gap-4 lg:grid-cols-3">
        <section className={panel}>
          <h2 className="mb-3 text-sm font-bold">Near Deadline</h2>
          {d?.nearDeadline.map((p) => (
            <Link
              className="mb-2 block text-xs text-blue-600"
              key={p._id}
              to={`/projects/${p._id}`}
            >
              {p.title} · {day(p.deadline)}
            </Link>
          ))}
          {!d?.nearDeadline.length && (
            <p className="text-xs text-slate-500">
              No projects due within 7 days.
            </p>
          )}
        </section>
        <section className={panel}>
          <h2 className="mb-3 text-sm font-bold">Team Workload</h2>
          {d?.workload.map((r) => (
            <p className="mb-2 flex justify-between text-xs" key={r._id}>
              <span>{r.name}</span>
              <span>
                {r.projects} projects · {r.allocation}%
              </span>
            </p>
          ))}
          {!d?.workload.length && (
            <p className="text-xs text-slate-500">No active allocations.</p>
          )}
        </section>
        <section className={panel}>
          <h2 className="mb-3 text-sm font-bold">Recently Completed</h2>
          {d?.recentlyCompleted.map((p) => (
            <Link
              className="mb-2 block text-xs text-blue-600"
              key={p._id}
              to={`/projects/${p._id}`}
            >
              {p.title} · {day(p.completedAt)}
            </Link>
          ))}
          {!d?.recentlyCompleted.length && (
            <p className="text-xs text-slate-500">No completed projects.</p>
          )}
        </section>
      </div>
    </>
  );
}
function ProjectDetail({ id, metadata, allowed, openForm, act, download }) {
  const location = useLocation();
  const tab = location.pathname.split('/')[3] || 'overview';
  const [page, setPage] = useState(1);
  const [kanban, setKanban] = useState(false);
  const [error, setError] = useState('');
  const project = useQuery({
    queryKey: ['projects', 'detail', id],
    queryFn: () => get(`/${id}`),
  });
  const notes = useQuery({
    queryKey: ['projects', 'notes', id, page],
    queryFn: () => get(`/${id}/notes`, { page, limit: 10 }),
    enabled: tab === 'overview',
  });
  const tabs = [
    'overview',
    ...(allowed('tasks.view') ? ['tasks'] : []),
    'milestones',
    'team',
    ...(allowed('files.view') ? ['files'] : []),
    ...(allowed('financials.view') ? ['financials'] : []),
    'activity',
  ];
  const valid = tabs.includes(tab);
  const data = useQuery({
    queryKey: ['projects', 'detailTab', id, tab, page],
    queryFn: () =>
      get(`/${id}/${tab}`, tab === 'financials' ? {} : { page, limit: 20 }),
    enabled: tab !== 'overview' && valid,
  });
  const p = project.data;
  const closed =
    p?.archivedAt || ['COMPLETED', 'CANCELLED'].includes(p?.status);
  const v = data.data;
  return (
    <State query={project}>
      {p && (
        <>
          <section className={panel}>
            <Link className="text-xs text-blue-600" to="/projects">
              ← All Projects
            </Link>
            <div className="my-3 flex flex-wrap justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{p.title}</h2>
                <p className="mt-2 text-xs text-[#7285a1]">
                  {p.projectId} ·{' '}
                  {p.clientRef?.companyName || 'Internal project'} · Due{' '}
                  {day(p.deadline) || 'Unscheduled'}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Badge value={p.status} />
                <Badge value={p.priority} />
                <Badge value={p.health} />
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {!closed && allowed('edit') && (
                <button
                  className={button}
                  onClick={() => openForm('project', p, p)}
                >
                  Edit Project
                </button>
              )}
              {!closed && allowed('tasks.create') && (
                <button
                  className={input}
                  style={{ width: 'auto' }}
                  onClick={() => openForm('task', p)}
                >
                  Add Task
                </button>
              )}
              {!closed && allowed('milestones.manage') && (
                <button
                  className={input}
                  style={{ width: 'auto' }}
                  onClick={() => openForm('milestone', p)}
                >
                  Add Milestone
                </button>
              )}
              {!p.archivedAt &&
                (allowed('change_status') ||
                  allowed('complete') ||
                  allowed('reopen')) && (
                  <button
                    className={input}
                    style={{ width: 'auto' }}
                    onClick={() => openForm('status', p)}
                  >
                    Change Status / Reopen
                  </button>
                )}
              {allowed('delete') && !p.archivedAt && (
                <button
                  className="text-xs text-red-600"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Archive this project? Tasks, files and financial history will be retained.',
                      )
                    )
                      act.mutate({ path: `/${id}` });
                  }}
                >
                  Archive
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
              {[
                ['Progress', `${p.progress}%`],
                [
                  'Tasks completed',
                  `${p.taskSummary.done}/${p.taskSummary.total}`,
                ],
                ['Pending tasks', p.taskSummary.total - p.taskSummary.done],
                [
                  'Team members',
                  p.teamMembers.filter((m) => m.status === 'ACTIVE').length,
                ],
                ['Days remaining', p.daysRemaining ?? 'Unscheduled'],
                [
                  'Milestones',
                  `${p.milestoneSummary.completed}/${p.milestoneSummary.total}`,
                ],
              ].map(([title, value]) => (
                <div key={title}>
                  <p className="text-[10px] text-[#7285a1]">{title}</p>
                  <p className="mt-1 text-lg font-bold">{value}</p>
                </div>
              ))}
            </div>
          </section>
          <nav className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <Link
                key={t}
                onClick={() => setPage(1)}
                to={`/projects/${id}${t === 'overview' ? '' : `/${t}`}`}
                className={`${input} !w-auto ${tab === t ? '!bg-[#087dda] text-white' : ''}`}
              >
                {label(t)}
              </Link>
            ))}
          </nav>
          {!valid ? (
            <p role="alert" className={panel}>
              You don't have permission to access this project section.
            </p>
          ) : tab === 'overview' ? (
            <>
              <section className={panel}>
                <h3 className="mb-4 font-bold">Project Overview</h3>
                <div className="grid gap-4 text-xs sm:grid-cols-3">
                  {[
                    ['Client', p.clientRef?.companyName || 'Internal project'],
                    ['Service', label(p.service)],
                    ['Type', p.projectType],
                    ['Department', p.primaryDepartment?.name],
                    [
                      'Collaborating departments',
                      p.collaboratingDepartments.map((d) => d.name).join(', '),
                    ],
                    [
                      'Project manager',
                      p.projectManager?.name || p.assignedTo?.name,
                    ],
                    ['Start', day(p.startDate)],
                    ['Expected start', day(p.expectedStartDate)],
                    ['Deadline', day(p.deadline)],
                    ['Created', day(p.createdAt)],
                    ['Lead', p.lead?.leadId],
                    ['Lead source', p.lead?.leadSource],
                    ['Quotation', p.quotation?.quotationNumber],
                  ].map(([title, value]) => (
                    <div key={title}>
                      <p className="text-[#7285a1]">{title}</p>
                      <p className="mt-1">{value || '—'}</p>
                    </div>
                  ))}
                </div>
                {p.lead && allowed('view_all') && (
                  <Link
                    className="mt-3 inline-block text-xs text-blue-600"
                    to={`/crm/leads/${p.lead._id}`}
                  >
                    View Origin Lead
                  </Link>
                )}
                <p className="mt-5 whitespace-pre-wrap text-sm">
                  {p.description || p.notes || 'No description provided.'}
                </p>
                <p className="mt-4 whitespace-pre-wrap text-sm">
                  {p.scopeOfWork}
                </p>
                {p.completionNotes && (
                  <p className="mt-4 text-sm">
                    Completion: {p.completionNotes}
                  </p>
                )}
                {p.deliveryNotes && (
                  <p className="mt-3 text-sm">Delivery: {p.deliveryNotes}</p>
                )}
              </section>
              <section className={panel}>
                <div className="mb-4 flex justify-between">
                  <h3 className="font-bold">Comments / Notes</h3>
                  {!closed && (
                    <button
                      className="text-xs text-blue-600"
                      onClick={() => openForm('note', p)}
                    >
                      Add Comment
                    </button>
                  )}
                </div>
                <State query={notes}>
                  {notes.data?.items.map((n) => (
                    <article
                      key={n._id}
                      className="mb-3 border-b border-[#edf3f8] pb-3"
                    >
                      <p className="text-xs font-semibold">
                        {n.author?.name || 'Former user'} · {day(n.createdAt)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-xs">
                        {n.content}
                      </p>
                    </article>
                  ))}
                  <Table
                    columns={[]}
                    items={[]}
                    pagination={notes.data?.pagination}
                    onPage={setPage}
                    empty={notes.data?.items.length ? '' : 'No notes yet.'}
                  />
                </State>
              </section>
            </>
          ) : (
            <State query={data}>
              <section className={panel}>
                {error && (
                  <p role="alert" className="mb-3 text-red-600">
                    {error}
                  </p>
                )}
                {tab === 'tasks' && (
                  <>
                    <button
                      className="mb-4 text-xs text-blue-600"
                      onClick={() => setKanban((v) => !v)}
                    >
                      {kanban ? 'List View' : 'Kanban View'}
                    </button>
                    {kanban ? (
                      <>
                        <p className="mb-3 text-[10px] text-slate-500">
                          Board shows the current page. Use pagination to browse
                          more tasks.
                        </p>
                        <div className="grid gap-3 md:grid-cols-5">
                          {[
                            'TODO',
                            'IN_PROGRESS',
                            'REVIEW',
                            'COMPLETED',
                            'BLOCKED',
                          ].map((s) => (
                            <div
                              key={s}
                              className="space-y-2 rounded-xl bg-[#f0f7fd] p-3"
                            >
                              <h3 className="text-xs font-bold">{label(s)}</h3>
                              {v?.items
                                .filter((t) => t.status === s)
                                .map((t) => (
                                  <button
                                    key={t._id}
                                    className="w-full rounded-lg bg-white p-3 text-left text-xs shadow-sm"
                                    onClick={() =>
                                      !closed &&
                                      (allowed('tasks.edit') ||
                                        String(t.assignedTo?._id) ===
                                          String(metadata.currentUserId)) &&
                                      openForm('task', p, t)
                                    }
                                  >
                                    {t.title}
                                    <p className="my-2 text-[10px] text-slate-500">
                                      {t.assignedTo?.name || 'Unassigned'} ·{' '}
                                      {day(t.dueDate)}
                                    </p>
                                    <Badge value={t.priority} />
                                  </button>
                                ))}
                            </div>
                          ))}
                        </div>
                        <Table
                          columns={[]}
                          items={[]}
                          pagination={v?.pagination}
                          onPage={setPage}
                          empty=""
                        />
                      </>
                    ) : (
                      <Table
                        columns={[
                          ['taskId', 'Task ID'],
                          ['title', 'Task'],
                          [
                            'assignedTo',
                            'Assignee',
                            (t) => t.assignedTo?.name || 'Unassigned',
                          ],
                          [
                            'status',
                            'Status',
                            (t) => <Badge value={t.status} />,
                          ],
                          ['dueDate', 'Due', (t) => day(t.dueDate)],
                          ['estimatedHours', 'Estimated hours'],
                          ['actualHours', 'Recorded hours'],
                          [
                            'dependsOn',
                            'Dependencies',
                            (t) => t.dependsOn?.length || 0,
                          ],
                        ]}
                        items={v?.items || []}
                        pagination={v?.pagination}
                        onPage={setPage}
                        actions={(t) =>
                          !closed &&
                          (allowed('tasks.edit') ||
                            String(t.assignedTo?._id) ===
                              String(metadata.currentUserId)) && (
                            <button onClick={() => openForm('task', p, t)}>
                              Update
                            </button>
                          )
                        }
                        empty="No project tasks."
                      />
                    )}
                  </>
                )}
                {tab === 'milestones' && (
                  <Table
                    columns={[
                      ['title', 'Milestone'],
                      ['dueDate', 'Due', (m) => day(m.dueDate)],
                      [
                        'displayStatus',
                        'Status',
                        (m) => <Badge value={m.displayStatus} />,
                      ],
                      ['completedAt', 'Completed', (m) => day(m.completedAt)],
                    ]}
                    items={v?.items || []}
                    pagination={v?.pagination}
                    onPage={setPage}
                    actions={(m) =>
                      !closed &&
                      allowed('milestones.manage') && (
                        <button onClick={() => openForm('milestone', p, m)}>
                          Edit
                        </button>
                      )
                    }
                    empty="No milestones."
                  />
                )}
                {tab === 'team' && (
                  <>
                    {!closed && allowed('manage_team') && (
                      <button
                        className={`${button} mb-4`}
                        onClick={() => openForm('team', p)}
                      >
                        Add Team Member
                      </button>
                    )}
                    <Table
                      columns={[
                        [
                          'employee',
                          'Employee',
                          (m) => m.employee?.name || 'Former employee',
                        ],
                        [
                          'department',
                          'Department',
                          (m) => m.profile?.department,
                        ],
                        [
                          'designation',
                          'Designation',
                          (m) => m.profile?.designation,
                        ],
                        ['roleInProject', 'Project role'],
                        ['allocationPercentage', 'Allocation %'],
                        [
                          'tasks',
                          'Task completion',
                          (m) => `${m.tasks.done}/${m.tasks.total}`,
                        ],
                        ['status', 'Status', (m) => <Badge value={m.status} />],
                      ]}
                      items={v?.items || []}
                      actions={(m) =>
                        !closed &&
                        m.status === 'ACTIVE' &&
                        allowed('manage_team') && (
                          <>
                            <button onClick={() => openForm('team', p, m)}>
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Remove this member?'))
                                  act.mutate({ path: `/${id}/team/${m._id}` });
                              }}
                            >
                              Remove
                            </button>
                          </>
                        )
                      }
                      empty="No assigned team members."
                    />
                  </>
                )}
                {tab === 'files' && (
                  <>
                    {!closed && allowed('files.manage') && (
                      <button
                        className={`${button} mb-4`}
                        onClick={() => openForm('file', p)}
                      >
                        Upload File
                      </button>
                    )}
                    <p className="mb-3 text-xs text-slate-500">
                      Private project documents: PDF, PNG and JPEG.
                    </p>
                    <Table
                      columns={[
                        ['fileName', 'File'],
                        ['category', 'Category'],
                        [
                          'uploadedBy',
                          'Uploaded by',
                          (f) => f.uploadedBy?.name,
                        ],
                        ['createdAt', 'Uploaded', (f) => day(f.createdAt)],
                        ['size', 'KB', (f) => Math.ceil(f.size / 1024)],
                      ]}
                      items={v?.items || []}
                      pagination={v?.pagination}
                      onPage={setPage}
                      actions={(f) => (
                        <button
                          onClick={() =>
                            download(
                              `/${id}/files/${f._id}/download`,
                              f.fileName,
                            ).catch((e) =>
                              setError(
                                e.response?.data?.error?.message ||
                                  'Download failed',
                              ),
                            )
                          }
                        >
                          Download
                        </button>
                      )}
                      empty="No project files."
                    />
                  </>
                )}
                {tab === 'activity' && (
                  <Table
                    columns={[
                      ['createdAt', 'Date', (r) => day(r.createdAt)],
                      ['user', 'Actor', (r) => r.user?.name || 'Former user'],
                      [
                        'action',
                        'Activity',
                        (r) => label(r.action.replace('project.', '')),
                      ],
                      [
                        'details',
                        'Details',
                        (r) => r.details?.title || r.details?.after || '',
                      ],
                    ]}
                    items={v?.items || []}
                    pagination={v?.pagination}
                    onPage={setPage}
                    empty="No project activity."
                  />
                )}
                {tab === 'financials' && v && (
                  <>
                    <div className="mb-5 grid gap-4 sm:grid-cols-3">
                      {[
                        [
                          'Budget',
                          v.budget !== undefined
                            ? new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: v.currency || 'INR',
                              }).format(v.budget)
                            : 'Restricted',
                        ],
                        ['Billed', money(v.billedMinor)],
                        [
                          'Collected',
                          v.collectedMinor === null
                            ? 'Restricted'
                            : money(v.collectedMinor),
                        ],
                        ['Outstanding', money(v.outstandingMinor)],
                        [
                          'Recorded direct costs',
                          v.directExpensesMinor === null
                            ? 'No recorded costs'
                            : money(v.directExpensesMinor),
                        ],
                      ].map(([title, value]) => (
                        <div key={title}>
                          <p className="text-xs text-slate-500">{title}</p>
                          <p className="mt-2 text-xl font-bold">{value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mb-4 text-xs text-amber-700">
                      {v.costCoverage}. Profit / margin is unavailable until
                      full cost coverage is established.
                    </p>
                    <Table
                      columns={[
                        ['invoiceNumber', 'Invoice'],
                        ['status', 'Status'],
                        [
                          'grandTotal',
                          'Total',
                          (r) =>
                            money(
                              r.totalMinor ?? Math.round(r.grandTotal * 100),
                            ),
                        ],
                      ]}
                      items={v.invoices}
                      actions={(r) => (
                        <Link to={`/finance/invoices/${r._id}`}>
                          View Invoice
                        </Link>
                      )}
                      empty="No linked invoices."
                    />
                  </>
                )}
              </section>
            </State>
          )}
        </>
      )}
    </State>
  );
}
function ProjectReports({ metadata, allowed, download }) {
  const [key, setKey] = useState('summary');
  const [filters, setFilters] = useState({ page: 1, limit: 20 });
  const [error, setError] = useState('');
  const q = useQuery({
    queryKey: ['projects', 'reports', key, filters],
    queryFn: () => get(`/reports/${key}`, filters),
    enabled: allowed('reports.view'),
  });
  if (!allowed('reports.view'))
    return (
      <p role="alert" className={panel}>
        Project reports permission required.
      </p>
    );
  const rows = q.data?.items || [];
  const columns = Object.keys(rows[0] || {})
    .filter((k) => k !== '_id')
    .map((k) => [
      k,
      label(k),
      (r) =>
        k.toLowerCase().includes('date') || k === 'deadline'
          ? day(r[k])
          : typeof r[k] === 'object'
            ? String(r[k] ?? '')
            : String(r[k] ?? ''),
    ]);
  return (
    <section className={panel}>
      <Link className="text-xs text-blue-600" to="/projects">
        ← Projects
      </Link>
      <h2 className="my-4 text-xl font-bold">Project Reports</h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <select
          aria-label="Project report"
          className={input}
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setFilters((f) => ({ ...f, page: 1 }));
          }}
        >
          {[
            'summary',
            'status',
            'upcoming',
            'ongoing',
            'completed',
            'delayed',
            'department',
            'manager',
            'team',
            'tasks',
            'milestones',
            'deadline',
            ...(allowed('financials.view') ? ['profitability'] : []),
          ].map((k) => (
            <option key={k} value={k}>
              {label(k)}
            </option>
          ))}
        </select>
        {[
          ['department', metadata.departments],
          ['manager', metadata.users],
          ['client', metadata.clients],
        ].map(([k, options]) => (
          <select
            aria-label={`Report ${k}`}
            className={input}
            key={k}
            value={filters[k] || ''}
            onChange={(e) =>
              setFilters((f) => {
                const next = { ...f, page: 1 };
                if (e.target.value) next[k] = e.target.value;
                else delete next[k];
                return next;
              })
            }
          >
            <option value="">All {k}s</option>
            {options.map((o) => (
              <option key={o._id} value={o._id}>
                {o.name || o.companyName}
              </option>
            ))}
          </select>
        ))}
        <select
          aria-label="Report status"
          className={input}
          value={filters.status || ''}
          onChange={(e) =>
            setFilters((f) => {
              const next = { ...f, page: 1 };
              if (e.target.value) next.status = e.target.value;
              else delete next.status;
              return next;
            })
          }
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {['from', 'to'].map((k) => (
          <label className="text-xs" key={k}>
            Start date {k}
            <input
              className={input}
              type="date"
              value={filters[k] || ''}
              onChange={(e) =>
                setFilters((f) => {
                  const next = { ...f, page: 1 };
                  if (e.target.value) next[k] = e.target.value;
                  else delete next[k];
                  return next;
                })
              }
            />
          </label>
        ))}
      </div>
      {allowed('reports.export') && (
        <div className="mb-4 flex gap-3">
          {['csv', 'xlsx', 'pdf'].map((format) => (
            <button
              key={format}
              className={button}
              onClick={() =>
                download(`/reports/${key}`, `projects-${key}.${format}`, {
                  ...filters,
                  format,
                }).catch(() =>
                  setError('Export failed. Check access or narrow filters.'),
                )
              }
            >
              <Download size={14} />
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      <State query={q}>
        <Table
          columns={columns}
          items={rows}
          pagination={q.data?.pagination}
          onPage={(page) => setFilters((f) => ({ ...f, page }))}
          empty="No matching report records."
        />
      </State>
    </section>
  );
}
