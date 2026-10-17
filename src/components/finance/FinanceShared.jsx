import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
export const financePanel =
  'rounded-2xl border border-[#dfeaf5] bg-white p-5 shadow-[0_7px_24px_#315d8608]';
export const financeInput =
  'min-h-10 w-full rounded-xl border border-[#dce7f0] bg-white px-3 py-2 text-xs outline-none focus:border-[#087dda] focus:ring-2 focus:ring-[#087dda18]';
export const financeButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#087dda] px-4 py-2 text-xs font-semibold text-white shadow-[0_3px_0_#00569b,0_5px_12px_#006eb51f] disabled:opacity-40';
export const has = (permissions, key) =>
  permissions?.includes('*') || permissions?.includes(key);
export const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0) / 100);
export const amountInput = (value) =>
  value === undefined
    ? ''
    : `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`;
export const day = (value) =>
  value ? new Date(new Date(value).getTime() + 19800000).toISOString().slice(0, 10) : '';
export const today = () =>
  new Date(Date.now() + 19800000).toISOString().slice(0, 10);
export const label = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
export function FinanceState({ query, children }) {
  if (query.isPending)
    return (
      <p
        role="status"
        className={`${financePanel} animate-pulse py-12 text-sm text-[#71859a]`}
      >
        Loading live financial data…
      </p>
    );
  if (query.isError)
    return (
      <div role="alert" className={financePanel}>
        <p>
          {query.error.response?.data?.error?.message ||
            'Unable to load finance data.'}
        </p>
        <button
          className={`${financeButton} mt-4`}
          onClick={() => query.refetch()}
        >
          Retry
        </button>
      </div>
    );
  return children;
}
export function FinanceBadge({ value }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-semibold ${['PAID', 'POSTED', 'APPROVED', 'ACTIVE'].includes(value) ? 'bg-[#e4f8ef] text-[#199769]' : ['OVERDUE', 'FAILED', 'REJECTED', 'REVERSED'].includes(value) ? 'bg-[#ffedf0] text-[#ec5273]' : ['PARTIALLY_PAID', 'PENDING_APPROVAL'].includes(value) ? 'bg-[#fff4df] text-[#b67a1c]' : 'bg-[#edf5ff] text-[#087dda]'}`}
    >
      {label(value)}
    </span>
  );
}
export function FinanceTable({
  columns,
  items,
  actions,
  pagination,
  onPage,
  onSort,
  empty = 'No financial records match these filters.',
}) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#f1f8fe] text-[#5d7ba9]">
            <tr>
              {columns.map(([key, title]) => (
                <th
                  className="whitespace-nowrap px-3 py-3 font-medium"
                  key={key}
                >
                  {onSort && ['invoiceNumber','invoiceDate','dueDate','totalMinor'].includes(key) ? <button onClick={() => onSort(key)}>{title} ↕</button> : title}
                </th>
              ))}
              {actions && <th className="px-3 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((row, index) => (
              <tr key={row._id || index} className="border-b border-[#edf3f8]">
                {columns.map(([key, , render]) => (
                  <td className="max-w-64 break-words px-3 py-3" key={key}>
                    {render
                      ? render(row)
                      : row[key] === null || row[key] === undefined
                        ? '—'
                        : String(row[key])}
                  </td>
                ))}
                {actions && (
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-[#087dda]">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && (
          <p className="py-12 text-center text-sm text-[#71859a]">{empty}</p>
        )}
      </div>
      {pagination && (
        <div className="mt-4 flex items-center justify-between text-xs">
          <button
            disabled={pagination.page <= 1}
            onClick={() => onPage(pagination.page - 1)}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} ·{' '}
            {pagination.total} records
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPage(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
export function FinanceBars({ rows, series }) {
  if (!rows?.length)
    return (
      <p className="grid h-56 place-items-center text-xs text-[#8da0b8]">
        No transactions in this period.
      </p>
    );
  return (
    <div className="h-60 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid stroke="#edf3f9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => money(value)}
          />
          <Tooltip formatter={(value) => money(value)} />
          {series.map(([key, name, color]) => (
            <Bar
              key={key}
              dataKey={key}
              name={name}
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function FinanceDonut({ rows, title }) {
  const colors = [
    '#087dda',
    '#39a9ff',
    '#14bad7',
    '#a297ff',
    '#ffb64e',
    '#ff7595',
  ];
  return rows?.length ? (
    <div className="grid items-center gap-2 sm:grid-cols-[1fr_1fr]">
      <div className="h-52 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="_id"
              innerRadius={55}
              outerRadius={85}
            >
              {rows.map((row, index) => (
                <Cell key={row._id} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => money(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-3">
        {rows.map((row, index) => (
          <li
            key={row._id}
            className="flex items-center justify-between gap-2 text-[10px]"
          >
            <span className="flex items-center gap-2">
              <i
                className="size-2 rounded-full"
                style={{ background: colors[index % colors.length] }}
              />
              {row._id || 'Unallocated'}
            </span>
            <strong>{money(row.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <p className="grid h-52 place-items-center text-xs text-[#8da0b8]">
      No {title.toLowerCase()} data.
    </p>
  );
}
