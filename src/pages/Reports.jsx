import { useEffect, useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  UsersRound,
  Building2,
  FolderKanban,
  ClipboardCheck,
  WalletCards,
  ContactRound,
  BriefcaseBusiness,
  Download,
  RefreshCw,
  Save,
  CalendarClock,
  Settings2,
  Search,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api.js';
import ReportLibrary from '../components/reports/ReportLibrary.jsx';
import { useAuthStore } from '../store/authStore.js';
import {
  ReportSaveDialog,
  ReportScheduleDialog,
  ReportAccessDialog,
} from '../components/reports/ReportDialogs.jsx';
import {
  reportPanel,
  reportInput,
  reportButton,
  permitted,
  titleCase,
  datePreset,
  displayCell,
  ReportQueryState,
  ReportChart,
  downloadReport,
} from '../components/reports/ReportShared.jsx';
const icons = {
  users: UsersRound,
  departments: Building2,
  projects: FolderKanban,
  hr: ClipboardCheck,
  finance: WalletCards,
  crm: ContactRound,
  management: BriefcaseBusiness,
};
const clean = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(
      ([, field]) => field !== '' && field !== undefined,
    ),
  );
const initialFilters = (search) =>
  Object.fromEntries(
    [...search.entries()].filter(([key]) =>
      [
        'from',
        'to',
        'department',
        'employee',
        'manager',
        'status',
        'role',
        'designation',
        'employmentType',
        'search',
        'sort',
        'order',
      ].includes(key),
    ),
  );
export default function Reports() {
  const location = useLocation(),
    [params] = useSearchParams(),
    view = params.get('view');
  const saved = useQuery({
    queryKey: ['savedReports'],
    enabled: Boolean(view),
    queryFn: async ({ signal }) =>
      (await api.get('/reports/saved', { signal })).data.data,
  });
  if (view) {
    const selected = saved.data?.find(
      (row) =>
        row._id === view && row.reportKey === location.pathname.split('/')[3],
    );
    return (
      <ReportQueryState query={saved}>
        {selected ? (
          <ReportsContent
            key={`${location.pathname}:${view}`}
            initialView={selected}
          />
        ) : (
          <p role="alert">
            Saved report is unavailable or outside your current access.
          </p>
        )}
      </ReportQueryState>
    );
  }
  return <ReportsContent key={`${location.pathname}:${location.search}`} />;
}
function ReportsContent({ initialView }) {
  const location = useLocation(),
    navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parts = location.pathname.split('/').filter(Boolean),
    category = parts[1],
    reportKey = parts[2];
  const special = ['saved', 'scheduled'].includes(category);
  const [exportKey, setExportKey] = useState('');
  const [catalogSearch, setCatalogSearch] = useState(''),
    [catalogType, setCatalogType] = useState(''),
    [roleAccess, setRoleAccess] = useState(''),
    [availability, setAvailability] = useState('available');
  const [librarySort, setLibrarySort] = useState('recommended');
  const [libraryPaging, setLibraryPaging] = useState({
    signature: '',
    page: 1,
  });
  const initial = () =>
    initialView
      ? clean({
          ...initialView.filters,
          page: undefined,
          limit: undefined,
          ...(initialView.sort
            ? { sort: initialView.sort.field, order: initialView.sort.order }
            : {}),
        })
      : initialFilters(searchParams);
  const [draft, setDraft] = useState(initial),
    [filters, setFilters] = useState(initial),
    [preset, setPreset] = useState('all'),
    [page, setPage] = useState(1),
    [columns, setColumns] = useState(initialView?.columns || []),
    [chart, setChart] = useState(initialView?.chart || 'bar'),
    [format, setFormat] = useState('csv'),
    [dialog, setDialog] = useState(null),
    [notice, setNotice] = useState(''),
    [search, setSearch] = useState('');
  const user = useAuthStore((state) => state.user),
    client = useQueryClient();
  useEffect(() => {
    const timer = setTimeout(() => setCatalogSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const librarySignature = JSON.stringify([
    category,
    catalogSearch,
    catalogType,
    roleAccess,
    availability,
    librarySort,
    filters.from,
    filters.to,
    filters.department,
  ]);
  const libraryPage =
    libraryPaging.signature === librarySignature ? libraryPaging.page : 1;
  const catalog = useQuery({
    queryKey: [
      'reports',
      category,
      catalogSearch,
      catalogType,
      roleAccess,
      availability,
      filters.from,
      filters.to,
      filters.department,
      librarySort,
      libraryPage,
    ],
    staleTime: 30000,
    placeholderData: (previous) => previous,
    queryFn: async ({ signal }) =>
      (
        await api.get('/reports', {
          signal,
          params: clean({
            category: category && !special ? category : undefined,
            search: catalogSearch,
            type: catalogType,
            roleAccess,
            status: availability,
            from: filters.from,
            to: filters.to,
            department: filters.department,
            page: reportKey || special ? 1 : libraryPage,
            limit: reportKey || special ? 200 : 12,
            sort: librarySort,
          }),
        })
      ).data.data,
  });
  const permissions = catalog.data?.permissions || [],
    items = catalog.data?.items || [];
  const detail = useQuery({
    queryKey: ['reportDetail', reportKey, filters, page],
    enabled: Boolean(reportKey),
    queryFn: async ({ signal }) =>
      (
        await api.get(`/reports/${reportKey}`, {
          signal,
          params: { ...clean(filters), page, limit: 20 },
        })
      ).data.data,
  });
  const saved = useQuery({
    queryKey: ['savedReports'],
    enabled: category === 'saved' || Boolean(searchParams.get('view')),
    queryFn: async ({ signal }) =>
      (await api.get('/reports/saved', { signal })).data.data,
  });
  const scheduled = useQuery({
    queryKey: ['scheduledReports'],
    enabled: category === 'scheduled',
    queryFn: async ({ signal }) =>
      (await api.get('/reports/scheduled', { signal })).data.data,
  });
  const analytics = useQuery({
    queryKey: ['reportUsage'],
    enabled: !category && permitted(permissions, 'reports.manage_access'),
    queryFn: async ({ signal }) =>
      (await api.get('/reports/analytics', { signal })).data.data,
  });
  const data = detail.data,
    report = data?.report;
  const visible = columns.length ? columns : report?.columns || [];
  const exportMutation = useMutation({
    mutationFn: ({ key, selected }) =>
      downloadReport(api, key, clean(filters), format, selected),
    onSuccess: () => {
      setNotice('Report exported successfully.');
      client.invalidateQueries({ queryKey: ['reports'] });
      client.invalidateQueries({ queryKey: ['reportUsage'] });
    },
  });
  const savedDelete = useMutation({
    mutationFn: (id) => api.delete(`/reports/saved/${id}`),
    onSuccess: () => {
      setNotice('Saved view deleted.');
      client.invalidateQueries({ queryKey: ['savedReports'] });
    },
  });
  const scheduleToggle = useMutation({
    mutationFn: (row) =>
      api.patch(`/reports/scheduled/${row._id}`, {
        name: row.name,
        reportKey: row.reportKey,
        filters: row.filters,
        format: row.format,
        frequency: row.frequency,
        recipients: row.recipients,
        status: row.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
      }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ['scheduledReports'] }),
  });
  function close(message) {
    setDialog(null);
    if (message) setNotice(message);
  }
  const urlFilters = new URLSearchParams(clean(filters)).toString();
  function reportPath(row) {
    return `/reports/${row.category}/${row.key}${urlFilters ? `?${urlFilters}` : ''}`;
  }
  function apply(event) {
    event.preventDefault();
    setFilters(clean(draft));
    setPage(1);
  }
  const selectedExport =
    items.find(
      (row) => row.key === exportKey && row.canExport && !row.unavailable,
    ) || items.find((row) => row.canExport && !row.unavailable);
  const allowedExport =
    permitted(permissions, 'reports.generate') &&
    report?.canExport &&
    !data?.unavailable;
  return (
    <div className="reports-page space-y-5 text-[#173958]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#087dda]">
            <BarChart3 size={15} />
            AdBorn ERP · Live reporting
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#0d2344] sm:text-3xl">
            {report?.title ||
              (category === 'saved'
                ? 'Saved Reports'
                : category === 'scheduled'
                  ? 'Scheduled Reports'
                  : category
                    ? `${titleCase(category)} Reports`
                    : 'Reports Management')}
          </h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-[#71859a]">
            {report?.description ||
              'Centralized reporting across users, departments, projects, HR and finance.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {reportKey ? (
            <>
              <button className={reportButton} onClick={() => detail.refetch()}>
                <RefreshCw size={14} />
                Refresh
              </button>
              {permitted(permissions, 'reports.manage_templates') &&
                report &&
                !data?.unavailable && (
                  <button
                    className={reportButton}
                    onClick={() => setDialog('save')}
                  >
                    <Save size={14} />
                    Save View
                  </button>
                )}
              {permitted(permissions, 'reports.schedule') && allowedExport && (
                <button
                  className={reportButton}
                  onClick={() => setDialog('schedule')}
                >
                  <CalendarClock size={14} />
                  Schedule Report
                </button>
              )}
            </>
          ) : (
            <>
              {permitted(permissions, 'reports.generate') && (
                <button
                  className={reportButton}
                  disabled={!items.some((row) => !row.unavailable)}
                  onClick={() => {
                    const row = items.find((item) => !item.unavailable);
                    if (row) navigate(reportPath(row));
                  }}
                >
                  + Generate Report
                </button>
              )}
              {permitted(permissions, 'reports.generate') && selectedExport && (
                <>
                  <select
                    aria-label="Report to export"
                    className={`${reportInput} max-w-52`}
                    value={selectedExport.key}
                    onChange={(event) => setExportKey(event.target.value)}
                  >
                    {items
                      .filter((row) => row.canExport && !row.unavailable)
                      .map((row) => (
                        <option key={row.key} value={row.key}>
                          {row.title}
                        </option>
                      ))}
                  </select>
                  <select
                    aria-label="Export format"
                    value={format}
                    className={reportInput}
                    onChange={(event) => setFormat(event.target.value)}
                  >
                    {['csv', 'xlsx', 'pdf'].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <button
                    className={reportButton}
                    disabled={exportMutation.isPending}
                    onClick={() =>
                      exportMutation.mutate({ key: selectedExport.key })
                    }
                  >
                    <Download size={14} />
                    Export
                  </button>
                </>
              )}
            </>
          )}
          {permitted(permissions, 'reports.manage_access') && (
            <button
              className={reportButton}
              onClick={() => setDialog('access')}
            >
              <Settings2 size={14} />
              Access settings
            </button>
          )}
        </div>
      </header>
      <nav
        aria-label="Reports navigation"
        className="flex flex-wrap gap-2 text-xs font-semibold"
      >
        <Link className={reportInput} to="/reports">
          All Reports
        </Link>
        <Link className={reportInput} to="/reports/saved">
          Saved Views
        </Link>
        {permitted(permissions, 'reports.schedule') && (
          <Link className={reportInput} to="/reports/scheduled">
            Scheduled Reports
          </Link>
        )}
        {catalog.data?.categories.map((item) => (
          <Link
            key={item.key}
            aria-current={category === item.key ? 'page' : undefined}
            className={`${reportInput} ${category === item.key ? 'bg-[#eaf5ff]!' : ''}`}
            to={`/reports/${item.key}`}
          >
            {item.title}
          </Link>
        ))}
      </nav>
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-[#eaf8f2] p-3 text-xs text-[#237c5b]"
        >
          {notice}
        </p>
      )}
      {[exportMutation, savedDelete, scheduleToggle].some(
        (mutation) => mutation.isError,
      ) && (
        <p role="alert" className="text-sm text-red-600">
          {[exportMutation, savedDelete, scheduleToggle].find(
            (mutation) => mutation.isError,
          )?.error?.response?.data?.error?.message ||
            exportMutation.error?.message ||
            'Unable to complete report action.'}
        </p>
      )}
      <ReportQueryState query={catalog}>
        {!reportKey && !special && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                'Total Available Reports',
                catalog.data?.summary.total,
                BarChart3,
              ],
              [
                'Scheduled Reports',
                catalog.data?.summary.scheduled,
                CalendarClock,
              ],
              [
                'Reports Generated This Month',
                catalog.data?.summary.generated,
                ClipboardCheck,
              ],
              [
                'Accessible Modules',
                catalog.data?.summary.modules,
                FolderKanban,
              ],
            ].map(([label, value, Icon]) => (
              <div key={label} className={reportPanel}>
                <span className="float-right rounded-xl bg-[#edf7ff] p-3 text-[#087dda]">
                  <Icon size={20} />
                </span>
                <p className="text-xs text-[#71859a]">{label}</p>
                <strong className="mt-4 block text-3xl text-[#0d2344]">
                  {value ?? 0}
                </strong>
              </div>
            ))}
          </div>
        )}
        {!special && (
          <form
            onSubmit={apply}
            className={`${reportPanel} flex flex-wrap items-end gap-3`}
          >
            {!reportKey && (
              <label className="text-[10px] text-[#71859a]">
                Search reports
                <div className="relative mt-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-3 text-[#71859a]"
                  />
                  <input
                    className={`${reportInput} pl-9`}
                    placeholder="Search reports"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </label>
            )}
            <label className="text-[10px] text-[#71859a]">
              Date range
              <select
                aria-label="Date range"
                className={`${reportInput} mt-1 block`}
                value={preset}
                onChange={(event) => {
                  const value = event.target.value;
                  setPreset(value);
                  const range = datePreset(value);
                  setDraft({
                    ...draft,
                    from: range.from || '',
                    to: range.to || '',
                  });
                }}
              >
                {[
                  ['all', 'All dates'],
                  ['today', 'Today'],
                  ['yesterday', 'Yesterday'],
                  ['week', 'This Week'],
                  ['month', 'This Month'],
                  ['last-month', 'Last Month'],
                  ['quarter', 'Quarter'],
                  ['financial-year', 'Financial Year'],
                  ['custom', 'Custom Range'],
                ].map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] text-[#71859a]">
              From
              <input
                aria-label="From date"
                className={`${reportInput} mt-1 block`}
                type="date"
                value={draft.from || ''}
                onChange={(event) => {
                  setPreset('custom');
                  setDraft({ ...draft, from: event.target.value });
                }}
              />
            </label>
            <label className="text-[10px] text-[#71859a]">
              To
              <input
                aria-label="To date"
                className={`${reportInput} mt-1 block`}
                type="date"
                value={draft.to || ''}
                onChange={(event) => {
                  setPreset('custom');
                  setDraft({ ...draft, to: event.target.value });
                }}
              />
            </label>
            <label className="text-[10px] text-[#71859a]">
              Department
              <select
                aria-label="Department"
                className={`${reportInput} mt-1 block max-w-52`}
                value={draft.department || ''}
                onChange={(event) =>
                  setDraft({ ...draft, department: event.target.value })
                }
              >
                <option value="">All within scope</option>
                {catalog.data?.departments.map((department) => (
                  <option key={department.key} value={department.key}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            {reportKey ? (
              <>
                <label className="text-[10px] text-[#71859a]">
                  Search data
                  <input
                    aria-label="Search report data"
                    className={`${reportInput} mt-1 block`}
                    value={draft.search || ''}
                    maxLength={100}
                    onChange={(event) =>
                      setDraft({ ...draft, search: event.target.value })
                    }
                  />
                </label>
                <label className="text-[10px] text-[#71859a]">
                  Status
                  <input
                    aria-label="Status"
                    className={`${reportInput} mt-1 block w-32`}
                    value={draft.status || ''}
                    maxLength={80}
                    placeholder="Any status"
                    onChange={(event) =>
                      setDraft({ ...draft, status: event.target.value })
                    }
                  />
                </label>
                <details className="text-xs">
                  <summary className="cursor-pointer p-2">More filters</summary>
                  <div className="mt-3 grid gap-2">
                    {[
                      'employee',
                      'manager',
                      'role',
                      'designation',
                      'employmentType',
                    ].map((field) => (
                      <label className="text-[10px]" key={field}>
                        {titleCase(field)}
                        <input
                          className={`${reportInput} ml-2`}
                          aria-label={titleCase(field)}
                          placeholder={
                            ['employee', 'manager'].includes(field)
                              ? 'Employee account ID'
                              : field === 'employmentType'
                                ? 'full_time / part_time / contract / intern'
                                : 'Any'
                          }
                          value={draft[field] || ''}
                          onChange={(event) =>
                            setDraft({ ...draft, [field]: event.target.value })
                          }
                        />
                      </label>
                    ))}
                  </div>
                </details>
              </>
            ) : (
              <>
                <label className="text-[10px] text-[#71859a]">
                  Report type
                  <select
                    className={`${reportInput} mt-1 block`}
                    value={catalogType}
                    onChange={(event) => setCatalogType(event.target.value)}
                  >
                    <option value="">All types</option>
                    {['Employees', 'Attendance', 'Leave', 'Payroll'].map(
                      (type) => (
                        <option key={type}>{type}</option>
                      ),
                    )}
                  </select>
                </label>
                <label className="text-[10px] text-[#71859a]">
                  Role access
                  <select
                    className={`${reportInput} mt-1 block`}
                    value={roleAccess}
                    onChange={(event) => setRoleAccess(event.target.value)}
                  >
                    <option value="">Any scope</option>
                    {['OWN', 'TEAM', 'DEPARTMENT', 'ASSIGNED', 'ALL'].map(
                      (scope) => (
                        <option key={scope}>{scope}</option>
                      ),
                    )}
                  </select>
                </label>
                <label className="text-[10px] text-[#71859a]">
                  Status
                  <select
                    className={`${reportInput} mt-1 block`}
                    value={availability}
                    onChange={(event) => setAvailability(event.target.value)}
                  >
                    <option value="">Any availability</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Source unavailable</option>
                  </select>
                </label>
              </>
            )}
            <button className={reportButton}>Apply filters</button>
            <button
              type="button"
              className="p-2 text-xs text-[#087dda]"
              onClick={() => {
                setDraft({});
                setFilters({});
                setPage(1);
                setPreset('all');
                setSearch('');
                setCatalogType('');
                setRoleAccess('');
                setAvailability('');
              }}
            >
              Reset filters
            </button>
          </form>
        )}
        {!reportKey && !special && (
          <>
            {!category && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {catalog.data?.categories.map((item) => {
                  const Icon = icons[item.key] || BarChart3;
                  return (
                    <article className={reportPanel} key={item.key}>
                      <span className="mb-4 inline-flex rounded-xl bg-[#eaf5ff] p-3 text-[#087dda]">
                        <Icon size={23} />
                      </span>
                      <h2 className="font-bold text-[#0d2344]">{item.title}</h2>
                      <p className="mt-2 text-xs leading-5 text-[#71859a]">
                        {item.description}
                      </p>
                      <p className="my-4 text-xs">
                        <strong>{item.count}</strong> Reports{' '}
                        <span className="ml-4 text-[#71859a]">
                          {item.saved} Templates
                        </span>
                      </p>
                      <Link
                        className="flex items-center gap-2 text-xs font-semibold text-[#087dda]"
                        to={`/reports/${item.key}${urlFilters ? `?${urlFilters}` : ''}`}
                      >
                        View Reports <ArrowRight size={14} />
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
            <ReportLibrary
              items={items}
              categories={
                catalog.data?.libraryCategories ||
                catalog.data?.categories ||
                []
              }
              category={category}
              pagination={catalog.data?.pagination}
              page={libraryPage}
              onPage={(next) =>
                setLibraryPaging({ signature: librarySignature, page: next })
              }
              sort={librarySort}
              onSort={setLibrarySort}
              availableOnly={availability === 'available'}
              onAvailability={(value) =>
                setAvailability(value ? 'available' : '')
              }
              reportPath={reportPath}
              busy={catalog.isFetching}
              onReset={() => {
                setSearch('');
                setCatalogType('');
                setRoleAccess('');
                setAvailability('available');
                setLibrarySort('recommended');
              }}
              search={search}
              onSearch={setSearch}
            />
            <div className="grid gap-5 xl:grid-cols-2">
              <section className={reportPanel}>
                <h2 className="font-bold">Your Report Access</h2>
                <p className="mt-3 text-xs text-[#71859a]">
                  {titleCase(user?.role || '')} · Permissions and source
                  ownership determine every report query and export.
                </p>
                <ul className="mt-4 space-y-3">
                  {catalog.data?.categories.map((item) => (
                    <li
                      key={item.key}
                      className="flex justify-between border-b border-[#edf2f7] pb-2 text-xs"
                    >
                      <span>{item.title}</span>
                      <strong className="text-[#087dda]">
                        {item.scope ||
                          items.find((row) => row.category === item.key)?.scope}
                      </strong>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[11px] text-[#71859a]">
                  Employees receive own reports; team grants follow reporting
                  hierarchy; department and assigned-project grants stay scoped.
                  Payroll and finance require separate permissions.
                </p>
              </section>
              <section className={reportPanel}>
                <h2 className="font-bold">Recent Generated Reports</h2>
                {!catalog.data?.recent.length && (
                  <p className="py-6 text-xs text-[#71859a]">
                    No exports generated yet. Simple report views are not
                    logged.
                  </p>
                )}
                <ul className="mt-3 divide-y divide-[#edf2f7]">
                  {catalog.data?.recent.map((row) => (
                    <li className="py-3 text-xs" key={row._id}>
                      <strong>{row.title}</strong>
                      <p className="mt-1 text-[#71859a]">
                        {titleCase(row.category)} · You · {row.scope} ·{' '}
                        {row.format.toUpperCase()} · {row.status} ·{' '}
                        {displayCell(row.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            {analytics.data && (
              <section className={reportPanel}>
                <h2 className="mb-4 font-bold">
                  Report Usage Analytics · Last 12 Months
                </h2>
                <ReportChart
                  rows={analytics.data.categories.map((row) => ({
                    label: titleCase(row._id),
                    value: row.count,
                  }))}
                />
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-bold">Exports by month</h3>
                    {analytics.data.months.map((row) => (
                      <p key={row._id} className="mt-2 text-xs">
                        {row._id}: {row.count}
                      </p>
                    ))}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold">Most used reports</h3>
                    {analytics.data.popular.map((row) => (
                      <p key={row._id} className="mt-2 text-xs">
                        {row._id}: {row.count}
                      </p>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
        {reportKey && (
          <ReportQueryState query={detail}>
            {data?.unavailable ? (
              <section className={reportPanel}>
                <h2 className="font-bold">Source data unavailable</h2>
                <p className="mt-3 text-sm">{data.unavailable}</p>
                <p className="mt-3 text-xs text-[#71859a]">
                  This report is not counted as available and cannot be exported
                  or scheduled.
                </p>
              </section>
            ) : (
              data && (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      ['Records in Scope', data.summary.records],
                      ['Result Rows', data.pagination.total],
                      ['Access Scope', data.scope],
                    ].map(([label, value]) => (
                      <div className={reportPanel} key={label}>
                        <p className="text-xs text-[#71859a]">{label}</p>
                        <strong className="mt-3 block text-2xl text-[#087dda]">
                          {displayCell(value)}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#71859a]">
                    {data.dateBasis} · Required: {report.permission}
                    {report.extraPermission
                      ? ` + ${report.extraPermission}`
                      : ''}
                    . Financial amounts remain separated by currency; chart
                    values are record counts.
                  </p>
                  {data.chart.length > 0 && (
                    <section className={reportPanel}>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-bold">
                          Record Distribution · Top 20 Groups
                        </h2>
                        <select
                          aria-label="Chart type"
                          value={chart}
                          onChange={(event) => setChart(event.target.value)}
                          className={reportInput}
                        >
                          {['bar', 'line', 'area', 'pie'].map((type) => (
                            <option key={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <ReportChart rows={data.chart} type={chart} />
                    </section>
                  )}
                  <section className={reportPanel}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-sm font-bold">Report Data</h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <details className="text-xs">
                          <summary className="cursor-pointer rounded-xl border p-3">
                            Columns
                          </summary>
                          <div className="my-2 flex max-w-xl flex-wrap gap-3">
                            {report.columns.map((column) => (
                              <label
                                key={column}
                                className="flex items-center gap-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={visible.includes(column)}
                                  onChange={(event) => {
                                    const next = event.target.checked
                                      ? [...visible, column]
                                      : visible.filter(
                                          (item) => item !== column,
                                        );
                                    if (next.length) setColumns(next);
                                  }}
                                />
                                {titleCase(column)}
                              </label>
                            ))}
                          </div>
                        </details>
                        {allowedExport && (
                          <>
                            <select
                              aria-label="Export format"
                              className={reportInput}
                              value={format}
                              onChange={(event) =>
                                setFormat(event.target.value)
                              }
                            >
                              {report.exportOptions.map((option) => (
                                <option key={option}>{option}</option>
                              ))}
                            </select>
                            <button
                              className={reportButton}
                              disabled={exportMutation.isPending}
                              onClick={() =>
                                exportMutation.mutate({
                                  key: report.key,
                                  selected: visible,
                                })
                              }
                            >
                              <Download size={14} />
                              {exportMutation.isPending
                                ? 'Exporting…'
                                : 'Export'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f3f8fd] text-[#587393]">
                          <tr>
                            {visible.map((column) => (
                              <th
                                key={column}
                                className="whitespace-nowrap px-3 py-3"
                              >
                                <button
                                  onClick={() => {
                                    const next = {
                                      ...filters,
                                      sort: column,
                                      order:
                                        filters.sort === column &&
                                        filters.order === 'asc'
                                          ? 'desc'
                                          : 'asc',
                                    };
                                    setFilters(next);
                                    setDraft(next);
                                    setPage(1);
                                  }}
                                >
                                  {titleCase(column)}{' '}
                                  {filters.sort === column
                                    ? filters.order === 'asc'
                                      ? '↑'
                                      : '↓'
                                    : '↕'}
                                </button>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.rows.map((row, index) => (
                            <tr
                              key={index}
                              className="border-b border-[#edf2f7]"
                            >
                              {visible.map((column) => (
                                <td
                                  className="max-w-64 break-words px-3 py-3"
                                  key={column}
                                >
                                  {displayCell(row[column])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!data.rows.length && (
                        <p className="py-12 text-center text-sm text-[#71859a]">
                          No report data available for the selected period or
                          reporting scope.
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <button
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        Previous
                      </button>
                      <span>
                        Page {page} of {Math.max(1, data.pagination.totalPages)}{' '}
                        · {data.pagination.total} rows
                      </span>
                      <button
                        disabled={page >= data.pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </section>
                </>
              )
            )}
          </ReportQueryState>
        )}
        {category === 'saved' && (
          <ReportQueryState query={saved}>
            <section className={reportPanel}>
              <h2 className="font-bold">Your Saved & Shared Views</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {saved.data?.map((row) => {
                  const target = items.find(
                    (item) => item.key === row.reportKey,
                  );
                  return (
                    <article className="rounded-xl border p-4" key={row._id}>
                      <h3 className="text-sm font-bold">{row.name}</h3>
                      <p className="my-3 text-xs text-[#71859a]">
                        {row.visibility} · Current viewer scope is always
                        recalculated
                      </p>
                      {target && (
                        <Link
                          className="text-xs font-semibold text-[#087dda]"
                          to={`/reports/${target.category}/${target.key}?view=${row._id}`}
                        >
                          Open saved report →
                        </Link>
                      )}
                      {(user?.role === 'super_admin' ||
                        String(row.owner) === String(user?.id || user?._id)) &&
                        permitted(permissions, 'reports.manage_templates') && (
                          <div className="mt-3 flex gap-4">
                            <button
                              className="text-xs text-[#087dda]"
                              onClick={() =>
                                setDialog({
                                  type: 'editSaved',
                                  row,
                                  report: target,
                                })
                              }
                            >
                              Edit view
                            </button>
                            <button
                              disabled={savedDelete.isPending}
                              className="text-xs text-red-600"
                              onClick={() => savedDelete.mutate(row._id)}
                            >
                              Delete view
                            </button>
                          </div>
                        )}
                    </article>
                  );
                })}
              </div>
              {!saved.data?.length && (
                <p className="py-8 text-sm text-[#71859a]">
                  No saved reports. Open an available report and choose Save
                  View.
                </p>
              )}
            </section>
          </ReportQueryState>
        )}
        {category === 'scheduled' && (
          <ReportQueryState query={scheduled}>
            <section className={reportPanel}>
              <h2 className="font-bold">Scheduled Delivery</h2>
              <p className="mt-2 text-xs text-[#71859a]">
                Schedules deliver to {scheduled.data?.recipient} using current
                permissions at run time.
              </p>
              {scheduled.data && !scheduled.data.deliveryEnabled && (
                <p role="alert" className="mt-3 text-sm">
                  SMTP delivery is disabled; schedules are stored but will not
                  run until mail is enabled.
                </p>
              )}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {scheduled.data?.items.map((row) => (
                  <article key={row._id} className="rounded-xl border p-4">
                    <h3 className="text-sm font-bold">{row.name}</h3>
                    <p className="my-3 text-xs">
                      {row.frequency} · {row.format.toUpperCase()} ·{' '}
                      {row.status}
                    </p>
                    <p className="text-xs text-[#71859a]">
                      Recipient: {row.recipients.join(', ')} ? Next run:{' '}
                      {displayCell(row.nextRunAt)}
                    </p>
                    {row.lastError && (
                      <p role="alert" className="mt-2 text-xs text-red-600">
                        {row.lastError}
                      </p>
                    )}
                    <div className="mt-4 flex gap-4">
                      <button
                        disabled={scheduleToggle.isPending}
                        className="text-xs text-[#087dda]"
                        onClick={() => scheduleToggle.mutate(row)}
                      >
                        {row.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        className="text-xs text-[#087dda]"
                        onClick={() =>
                          setDialog({
                            type: 'editSchedule',
                            row,
                            report: items.find(
                              (item) => item.key === row.reportKey,
                            ),
                          })
                        }
                      >
                        Edit schedule
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {!scheduled.data?.items.length && (
                <p className="py-8 text-sm text-[#71859a]">
                  No schedules yet. Open a report and choose Schedule Report.
                </p>
              )}
            </section>
          </ReportQueryState>
        )}
      </ReportQueryState>
      {dialog === 'save' && report && (
        <ReportSaveDialog
          report={report}
          filters={clean(filters)}
          columns={visible}
          chart={chart}
          permissions={permissions}
          onClose={close}
        />
      )}
      {dialog === 'schedule' && report && (
        <ReportScheduleDialog
          report={report}
          filters={clean(filters)}
          onClose={close}
        />
      )}
      {dialog === 'access' && <ReportAccessDialog onClose={close} />}
      {dialog?.type === 'editSaved' && dialog.report && (
        <ReportSaveDialog
          report={dialog.report}
          filters={dialog.row.filters}
          columns={dialog.row.columns}
          chart={dialog.row.chart}
          existing={dialog.row}
          permissions={permissions}
          onClose={close}
        />
      )}
      {dialog?.type === 'editSchedule' && dialog.report && (
        <ReportScheduleDialog
          report={dialog.report}
          filters={dialog.row.filters}
          existing={dialog.row}
          onClose={close}
        />
      )}
    </div>
  );
}
