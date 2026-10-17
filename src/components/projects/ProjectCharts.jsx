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
const colors = [
  '#008aff',
  '#8964ff',
  '#00bc79',
  '#ffa129',
  '#1bc7bd',
  '#fa6785',
];
export function ProjectBars({ data }) {
  return data.length ? (
    <div className="h-52 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="#edf3f8" />
          <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
          <Tooltip />
          <Bar dataKey="projects" fill="#339dff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <p className="grid h-52 place-items-center text-xs text-slate-500">
      No department allocations.
    </p>
  );
}
export function ProjectDonut({ data, total }) {
  return data.length ? (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <div className="relative h-48 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={49}
              outerRadius={76}
            >
              {data.map((r, i) => (
                <Cell key={r.name} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-xs">
          <b className="text-xl">{total}</b>Projects
        </div>
      </div>
      <ul className="min-w-28 space-y-3 text-[10px]">
        {data.map((r, i) => (
          <li key={r.name} className="flex justify-between gap-3">
            <span>
              <i
                className="mr-2 inline-block size-2 rounded-full"
                style={{ background: colors[i % colors.length] }}
              />
              {r.name}
            </span>
            <b>
              {r.value} ({total ? Math.round((r.value / total) * 100) : 0}%)
            </b>
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <p className="grid h-52 place-items-center text-xs text-slate-500">
      No projects yet.
    </p>
  );
}
