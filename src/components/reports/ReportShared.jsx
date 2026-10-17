import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
export const reportPanel =
  'rounded-2xl border border-[#e1eaf3] bg-white p-5 shadow-[0_4px_0_#e7eef5,0_10px_25px_#315d860a]';
export const reportInput =
  'min-h-10 rounded-xl border border-[#dce7f0] bg-white px-3 py-2 text-xs text-[#173958] outline-none focus:border-[#0987c4] focus:ring-2 focus:ring-[#0987c420]';
export const reportButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#087dda] px-4 py-2 text-xs font-semibold text-white shadow-[0_3px_0_#00569b,0_5px_12px_#006eb51f] disabled:opacity-40';
export const titleCase = (value) =>
  String(value)
    .replaceAll('_', ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
export const displayCell = (value) =>
  value === null || value === undefined || value === ''
    ? '—'
    : typeof value === 'number'
      ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 })
      : /^\d{4}-\d{2}-\d{2}T/.test(String(value))
        ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : String(value);
export const permitted = (permissions, permission) =>
  permissions?.includes('*') || permissions?.includes(permission);
const iso = (date) => date.toISOString().slice(0, 10);
export function datePreset(preset) {
  const now = new Date(Date.now() + 19800000),
    today = new Date(`${iso(now)}T00:00:00Z`),
    from = new Date(today),
    to = new Date(today);
  if (preset === 'all' || preset === 'custom') return {};
  if (preset === 'yesterday') {
    from.setUTCDate(from.getUTCDate() - 1);
    to.setUTCDate(to.getUTCDate() - 1);
  }
  if (preset === 'week')
    from.setUTCDate(from.getUTCDate() - ((from.getUTCDay() + 6) % 7));
  if (preset === 'month') from.setUTCDate(1);
  if (preset === 'last-month') {
    from.setUTCDate(1);
    from.setUTCMonth(from.getUTCMonth() - 1);
    to.setUTCDate(0);
  }
  if (preset === 'quarter') {
    from.setUTCDate(1);
    from.setUTCMonth(Math.floor(from.getUTCMonth() / 3) * 3);
  }
  if (preset === 'financial-year') {
    from.setUTCFullYear(
      from.getUTCFullYear() - (from.getUTCMonth() < 3 ? 1 : 0),
    );
    from.setUTCMonth(3, 1);
  }
  return { from: iso(from), to: iso(to) };
}
export function ReportQueryState({ query, children }) {
  if (query.isPending)
    return (
      <div
        role="status"
        className={`${reportPanel} animate-pulse py-12 text-sm text-[#71859a]`}
      >
        Loading live reports…
      </div>
    );
  if (query.isError)
    return (
      <div role="alert" className={reportPanel}>
        <p>
          {query.error.response?.data?.error?.message ||
            'Unable to load reports. Please retry.'}
        </p>
        <button
          className={`${reportButton} mt-4`}
          onClick={() => query.refetch()}
        >
          Retry
        </button>
      </div>
    );
  return children;
}
export function ReportChart({ rows, type = 'bar' }) {
  if (!rows?.length) return null;
  const colors = ['#087dda', '#22b8dc', '#61a5e9', '#76cfbb', '#9bb5e4'];
  const axes = (
    <>
      <CartesianGrid stroke="#edf2f7" vertical={false} />
      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
      <Tooltip />
    </>
  );
  return (
    <div aria-label="Report distribution chart" className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'line' ? (
          <LineChart data={rows}>
            {axes}
            <Line dataKey="value" stroke="#087dda" strokeWidth={3} />
          </LineChart>
        ) : type === 'area' ? (
          <AreaChart data={rows}>
            {axes}
            <Area dataKey="value" stroke="#087dda" fill="#d8ecff" />
          </AreaChart>
        ) : type === 'pie' ? (
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="label"
              innerRadius={48}
              outerRadius={90}
            >
              {rows.map((row, index) => (
                <Cell key={row.label} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        ) : (
          <BarChart data={rows}>
            {axes}
            <Bar dataKey="value" fill="#087dda" radius={[5, 5, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
export async function downloadReport(api, key, filters, format, columns) {
  let response;
  try {
    response = await api.post(
      `/reports/${key}/export`,
      { filters, format, columns },
      { responseType: 'blob', timeout: 60000 },
    );
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const body = JSON.parse(await error.response.data.text());
        throw new Error(body.error?.message || 'Export failed');
      } catch (parsed) {
        if (parsed instanceof SyntaxError) throw error;
        throw parsed;
      }
    }
    throw error;
  }
  const url = URL.createObjectURL(response.data),
    anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${key}.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
