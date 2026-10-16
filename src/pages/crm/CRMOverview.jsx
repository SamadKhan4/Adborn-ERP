import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Legend,
} from 'recharts';
import { api } from '../../services/api.js';
import CRMDateFilter, {
  dateRange,
} from '../../components/crm/CRMDateFilter.jsx';
import {
  can,
  money,
  panel,
  QueryState,
  useMetadata,
  usePermissions,
} from '../../components/crm/CRMShared.jsx';
import { label } from '../../../shared/crm.js';
export default function CRMOverview() {
  const [range, setRange] = useState(() => dateRange('month'));
  const permissions = usePermissions();
  const metadata = useMetadata();
  const query = useQuery({
    queryKey: ['crmDashboard', range],
    queryFn: async () =>
      (await api.get('/crm/dashboard', { params: range })).data.data,
    enabled: can(permissions, 'crm.dashboard.view'),
  });
  const data = query.data;
  if (!can(permissions, 'crm.dashboard.view'))
    return (
      <p role="alert">
        You do not have permission to view the CRM dashboard. Use an available
        CRM tab.
      </p>
    );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-bold">CRM overview</h2>
        <CRMDateFilter onChange={setRange} />
      </div>
      <QueryState query={query}>
        {data && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[
                ['Total Leads', data.totals.total],
                ['New Leads', data.totals.new],
                ['Open Leads', data.totals.open],
                ['Qualified Leads', data.totals.qualified],
                ['Won Leads', data.totals.won],
                ['Lost Leads', data.totals.lost],
                ['Conversion Rate', `${data.totals.conversionRate}%`],
                [
                  'Estimated Pipeline Value',
                  data.currencies
                    .map((row) => money(row.pipelineValue, row._id))
                    .join(' · ') || money(0),
                ],
                ['Follow-ups Today', data.totals.followupsToday],
                ['Overdue Follow-ups', data.totals.overdueFollowups],
              ].map(([title, value]) => (
                <div key={title} className={panel}>
                  <p className="text-[11px] text-slate-500">{title}</p>
                  <strong className="mt-2 block text-xl text-[#006eb5]">
                    {value}
                  </strong>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">{data.basis}</p>
            <div className="grid gap-5 xl:grid-cols-2">
              <section className={panel}>
                <h3 className="text-sm font-bold">
                  Lead funnel · current stages
                </h3>
                <p className="mt-1 text-[10px] text-slate-500">
                  Percentages use all leads in the selected creation cohort.
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    'NEW',
                    'CONTACTED',
                    'QUALIFIED',
                    'PROPOSAL_SENT',
                    'NEGOTIATION',
                    'WON',
                  ].map((stage) => {
                    const count =
                      data.funnel.find((row) => row._id === stage)?.count || 0;
                    const percent = data.totals.total
                      ? (count / data.totals.total) * 100
                      : 0;
                    return (
                      <div key={stage}>
                        <div className="flex justify-between text-xs">
                          <span>
                            {metadata.data?.stageLabels[stage] || label(stage)}
                          </span>
                          <strong>
                            {count} · {percent.toFixed(1)}%
                          </strong>
                        </div>
                        <div className="mt-1 h-2 rounded bg-slate-100">
                          <div
                            className="h-2 rounded bg-[#0987c4]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
              <section className={panel}>
                <h3 className="mb-4 text-sm font-bold">
                  Lead source performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr>
                        <th className="pb-3">Source</th>
                        <th>Leads</th>
                        <th>Won</th>
                        <th>Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(metadata.data?.sources || []).map((source) => {
                        const row = data.sources.find(
                          (item) => item._id === source,
                        );
                        return (
                          <tr key={source} className="border-t">
                            <td className="py-2">{source}</td>
                            <td>{row?.count || 0}</td>
                            <td>{row?.won || 0}</td>
                            <td>
                              {row?.count
                                ? ((row.won / row.count) * 100).toFixed(1)
                                : 0}
                              %
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className={panel}>
                <h3 className="mb-4 text-sm font-bold">Monthly lead cohorts</h3>
                <p className="mb-3 text-[10px] text-slate-500">
                  New leads by creation month; won/lost show their current
                  outcomes.
                </p>
                <div className="h-64 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Line dataKey="new" stroke="#0987c4" name="New leads" />
                      <Line dataKey="won" stroke="#10b981" name="Won" />
                      <Line dataKey="lost" stroke="#e05262" name="Lost" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section className={panel}>
                <h3 className="mb-4 text-sm font-bold">
                  Sales workload · top 10 by assigned count
                </h3>
                <p className="mb-3 text-[10px] text-slate-500">
                  Workload comparison, not a performance ranking. Currency rows
                  remain separate.
                </p>
                <div className="h-64 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.performance.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="assigned" fill="#0987c4" name="Assigned" />
                      <Bar dataKey="won" fill="#10b981" name="Won" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
            {!data.totals.total && (
              <p className={panel}>No leads found for this date range.</p>
            )}
          </>
        )}
      </QueryState>
    </div>
  );
}
