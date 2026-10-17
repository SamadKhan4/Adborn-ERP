import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  UsersRound,
  Building2,
  FolderKanban,
  ClipboardCheck,
  WalletCards,
  ContactRound,
  BriefcaseBusiness,
  ShieldCheck,
  SearchX,
  Search,
} from 'lucide-react';
import { reportPanel, reportInput } from './ReportShared.jsx';
const icons = {
  users: UsersRound,
  departments: Building2,
  projects: FolderKanban,
  hr: ClipboardCheck,
  finance: WalletCards,
  crm: ContactRound,
  management: BriefcaseBusiness,
};
const scopes = {
  OWN: 'My records',
  TEAM: 'My team',
  DEPARTMENT: 'My department',
  ASSIGNED: 'Assigned to me',
  ALL: 'All permitted records',
};
export default function ReportLibrary({
  items,
  categories,
  category,
  pagination,
  page,
  onPage,
  sort,
  onSort,
  availableOnly,
  onAvailability,
  reportPath,
  busy,
  onReset,
  search = '',
  onSearch,
}) {
  const total = pagination?.total ?? items.length,
    pages = pagination?.totalPages || 1,
    limit = pagination?.limit || 12;
  return (
    <section
      id="report-library"
      aria-label="Report Library"
      aria-busy={busy}
      className={`${reportPanel} scroll-mt-6`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0d2344]">Report Library</h2>
          <p className="mt-1 text-xs leading-5 text-[#71859a]">
            Choose a report to explore live data. Filters, charts and exports
            are inside.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) => onAvailability(event.target.checked)}
              className="accent-[#087dda]"
            />
            Available only
          </label>
          <select
            aria-label="Sort report library"
            className={reportInput}
            value={sort}
            onChange={(event) => onSort(event.target.value)}
          >
            <option value="recommended">Recommended</option>
            <option value="name">Name: A–Z</option>
          </select>
        </div>
      </div>
      <label className="relative mt-5 block max-w-xl">
        <span className="sr-only">Find a report</span>
        <Search className="absolute left-3 top-3 text-[#71859a]" size={16} />
        <input
          value={search}
          onChange={(event) => onSearch?.(event.target.value)}
          placeholder="Find attendance, tasks, invoices…"
          className={`${reportInput} w-full pl-10`}
        />
      </label>
      <nav
        aria-label="Report library categories"
        className="my-5 flex gap-2 overflow-x-auto pb-2"
      >
        <Link
          to="/reports#report-library"
          aria-current={!category ? 'page' : undefined}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${!category ? 'bg-[#087dda] text-white' : 'bg-[#f2f7fc] text-[#587393]'}`}
        >
          All categories
        </Link>
        {categories.map((item) => (
          <Link
            key={item.key}
            to={`/reports/${item.key}#report-library`}
            aria-current={category === item.key ? 'page' : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${category === item.key ? 'bg-[#087dda] text-white' : 'bg-[#f2f7fc] text-[#587393]'}`}
          >
            {item.title.replace(' Reports', '')}{' '}
            <span className="ml-1 opacity-70">{item.count}</span>
          </Link>
        ))}
      </nav>
      <div
        aria-live="polite"
        className="mb-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#71859a]"
      >
        <span>
          {busy
            ? 'Updating reports…'
            : total
              ? `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total} reports`
              : 'No matching reports'}
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck size={13} />
          Only reports you can access
        </span>
      </div>
      {!items.length ? (
        <div className="rounded-xl bg-[#f7fbfe] py-12 text-center">
          <SearchX className="mx-auto text-[#8eb8d8]" size={32} />
          <h3 className="mt-3 text-sm font-semibold">
            No reports match these filters
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs text-[#71859a]">
            Try another category or clear your search. Your access permissions
            always stay applied.
          </p>
          <button
            className="mt-4 text-xs font-semibold text-[#087dda]"
            onClick={onReset}
          >
            Clear library filters
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 ${busy ? 'opacity-60' : ''}`}
        >
          {items.map((report) => {
            const Icon = icons[report.category] || BarChart3;
            return (
              <Link
                key={report.key}
                to={reportPath(report)}
                className="group flex min-h-48 flex-col rounded-2xl border border-[#e3ecf4] bg-gradient-to-b from-white to-[#fbfdff] p-4 transition-shadow hover:border-[#acd4f1] hover:shadow-[0_8px_20px_#315d8614] focus-visible:outline-2 focus-visible:outline-[#087dda]"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#edf7ff] text-[#087dda]">
                    <Icon size={18} />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${report.unavailable ? 'bg-[#fff4e6] text-[#a96d1e]' : 'bg-[#edf8f3] text-[#27836a]'}`}
                  >
                    {report.unavailable ? 'Data unavailable' : 'Live report'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#173958]">
                  {report.title}
                </h3>
                <p className="mb-4 mt-2 line-clamp-2 text-[11px] leading-5 text-[#71859a]">
                  {report.description}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#edf2f7] pt-3">
                  <span className="text-[10px] text-[#71859a]">
                    {scopes[report.scope] || 'Your permitted records'}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[#087dda]">
                    {report.unavailable ? 'View reason' : 'View report'}
                    <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {total > limit && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf2f7] pt-4 text-xs">
          <span className="text-[#71859a]">
            Page {page} of {pages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || busy}
              className={`${reportInput} disabled:opacity-40`}
              onClick={() => onPage(page - 1)}
            >
              Previous reports
            </button>
            {Array.from(
              { length: Math.min(5, pages) },
              (_, index) => Math.max(1, Math.min(page - 2, pages - 4)) + index,
            ).map((number) => (
              <button
                aria-label={`Report page ${number}`}
                aria-current={page === number ? 'page' : undefined}
                disabled={busy}
                key={number}
                className={`hidden size-9 rounded-lg sm:block ${page === number ? 'bg-[#087dda] font-bold text-white' : 'bg-[#f2f7fc]'}`}
                onClick={() => onPage(number)}
              >
                {number}
              </button>
            ))}
            <button
              disabled={page >= pages || busy}
              className={`${reportInput} disabled:opacity-40`}
              onClick={() => onPage(page + 1)}
            >
              Next reports
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
