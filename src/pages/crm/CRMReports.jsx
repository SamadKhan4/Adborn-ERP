import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import CRMDateFilter, {
  dateRange,
} from '../../components/crm/CRMDateFilter.jsx';
import { Button } from '../../components/ui/Button.jsx';
import {
  AssigneeSelect,
  can,
  downloadCSV,
  Field,
  input,
  Message,
  Pager,
  panel,
  QueryState,
  useCRMMutation,
  useMetadata,
  usePermissions,
} from '../../components/crm/CRMShared.jsx';
import { label } from '../../../../shared/crm.js';
export default function CRMReports() {
  const [kind, setKind] = useState('lead-source');
  const [range, setRange] = useState(() => dateRange('month'));
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const metadata = useMetadata();
  const permissions = usePermissions();
  const params = { ...range, ...filters, page, limit: 20 };
  const query = useQuery({
    queryKey: ['crmReports', kind, params],
    queryFn: async () =>
      (await api.get(`/crm/reports/${kind}`, { params })).data.data,
    enabled: can(permissions, 'crm.reports.view'),
  });
  const exportMutation = useCRMMutation(
    async () =>
      (
        await api.get(`/crm/reports/${kind}/export`, {
          params: { ...range, ...filters },
        })
      ).data,
    (csv) => downloadCSV(`crm-${kind}.csv`, csv),
    [],
  );
  if (!can(permissions, 'crm.reports.view'))
    return <p role="alert">You do not have permission to view CRM reports.</p>;
  const columns = [
    ...new Set((query.data?.items || []).flatMap((row) => Object.keys(row))),
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-lg font-bold">CRM reports</h2>
        {can(permissions, 'crm.reports.export') && (
          <Button
            variant="secondary"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            Export report CSV
          </Button>
        )}
      </div>
      <section className={panel}>
        <CRMDateFilter
          onChange={(value) => {
            setRange(value);
            setPage(1);
          }}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Field label="Report">
            <select
              className={input}
              value={kind}
              onChange={(event) => {
                setKind(event.target.value);
                setPage(1);
              }}
            >
              {[
                'lead-source',
                'conversion',
                'pipeline',
                'won-lost',
                'performance',
                'service-interest',
                'aging',
                'followup',
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="Employee">
            <AssigneeSelect
              value={filters.assignedTo}
              onChange={(value) => {
                setFilters({ ...filters, assignedTo: value || undefined });
                setPage(1);
              }}
            />
          </Field>
          {[
            ['source', metadata.data?.sources],
            ['service', metadata.data?.serviceCatalog.map((item) => item.id)],
            ['stage', metadata.data?.stages],
          ].map(([key, values]) => (
            <Field key={key} label={label(key)}>
              <select
                className={input}
                value={filters[key] || ''}
                onChange={(event) => {
                  setFilters({
                    ...filters,
                    [key]: event.target.value || undefined,
                  });
                  setPage(1);
                }}
              >
                <option value="">All</option>
                {values?.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>
          ))}
        </div>
      </section>
      <Message mutation={exportMutation} />
      <QueryState query={query}>
        <section className={panel}>
          <p className="mb-4 text-xs">
            Total leads: {query.data?.totals.total || 0} · Won:{' '}
            {query.data?.totals.won || 0} · Conversion:{' '}
            {query.data?.totals.conversionRate || 0}%
          </p>
          <p className="mb-4 text-[10px] text-slate-500">
            {query.data?.basis} Aging buckets: 0 = 0–7 days, 8 = 8–15, 16 =
            16–30, 31 = 31–60, 60+ = over 60. Stale means open with no activity
            for 15 days.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  {columns.map((key) => (
                    <th key={key} className="whitespace-nowrap bg-slate-50 p-3">
                      {label(key === '_id' ? 'Group' : key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data?.items.map((row, index) => (
                  <tr key={index} className="border-t">
                    {columns.map((key) => (
                      <td key={key} className="whitespace-nowrap p-3">
                        {typeof row[key] === 'object'
                          ? Object.entries(row[key] || {})
                              .map(
                                ([name, value]) =>
                                  `${name}: ${value || 'Unassigned'}`,
                              )
                              .join(' · ')
                          : String(row[key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!query.data?.items.length && (
              <p className="py-8 text-center text-xs text-slate-500">
                No report records found.
              </p>
            )}
          </div>
          <Pager
            page={page}
            pagination={query.data?.pagination}
            onPage={setPage}
          />
        </section>
      </QueryState>
    </div>
  );
}
