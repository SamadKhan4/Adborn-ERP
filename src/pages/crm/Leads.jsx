import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { Button } from '../../components/ui/Button.jsx';
import LeadForm from '../../components/crm/LeadForm.jsx';
import LeadImportDialog from '../../components/crm/LeadImportDialog.jsx';
import HRMSDialog from '../../components/hrms/HRMSDialog.jsx';
import {
  AssigneeSelect,
  Badge,
  can,
  date,
  downloadCSV,
  Field,
  input,
  Message,
  money,
  Pager,
  panel,
  QueryState,
  useCRMMutation,
  useDebounced,
  useMetadata,
  usePermissions,
} from '../../components/crm/CRMShared.jsx';
import { label } from '../../../../shared/crm.js';
const columns = [
  'leadId',
  'companyName',
  'contactPerson',
  'phone',
  'interestedServices',
  'leadSource',
  'assignedTo',
  'stage',
  'priority',
  'estimatedBudget',
  'nextFollowUpAt',
  'createdAt',
];
export default function Leads() {
  const [importOpen, setImportOpen] = useState(false);
  const permissions = usePermissions();
  const metadata = useMetadata();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [draft, setDraft] = useState({});
  const [filters, setFilters] = useState({});
  const [visible, setVisible] = useState(columns);
  const [selected, setSelected] = useState([]);
  const [create, setCreate] = useState(false);
  const [assign, setAssign] = useState(false);
  const [owner, setOwner] = useState('');

  const params = {
    page,
    limit: 20,
    search: debounced,
    sort,
    order,
    ...filters,
  };
  const query = useQuery({
    queryKey: ['leads', params],
    queryFn: async ({ signal }) =>
      (await api.get('/crm/leads', { params, signal })).data.data,
  });
  const mutation = useCRMMutation(
    async () =>
      (
        await api.post('/crm/leads/bulk-assign', {
          ids: selected,
          assignedTo: owner,
        })
      ).data,
    () => {
      setAssign(false);
      setSelected([]);
    },
  );
  const exportMutation = useCRMMutation(
    async () =>
      (
        await api.get('/crm/reports/export', {
          params: { ...params, page: undefined, limit: undefined },
        })
      ).data,
    (csv) => downloadCSV('crm-leads.csv', csv),
    [],
  );
  const render = (lead, key) =>
    key === 'leadId' || key === 'companyName' ? (
      <Link
        to={`/crm/leads/${lead._id}`}
        className="font-semibold text-[#006eb5]"
      >
        {lead[key]}
      </Link>
    ) : ['stage', 'priority'].includes(key) ? (
      <Badge value={lead[key]} />
    ) : key === 'assignedTo' ? (
      lead.assignedTo?.name || 'Unassigned'
    ) : key === 'interestedServices' ? (
      lead[key]
        .map(
          (value) =>
            metadata.data?.serviceCatalog.find((item) => item.id === value)
              ?.label || value,
        )
        .join(', ')
    ) : key === 'estimatedBudget' ? (
      money(lead[key], lead.currency)
    ) : ['nextFollowUpAt', 'createdAt'].includes(key) ? (
      date(lead[key])
    ) : (
      lead[key] || '—'
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Leads</h2>
        <div className="flex gap-2">
          {can(permissions, 'crm.reports.export') && (
            <Button
              variant="secondary"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              Export CSV
            </Button>
          )}
          {can(permissions, 'crm.leads.import') &&
            can(permissions, 'crm.leads.create') && (
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                Import Leads
              </Button>
            )}
          {can(permissions, 'crm.leads.create') && (
            <Button onClick={() => setCreate(true)}>Add Lead</Button>
          )}
        </div>
      </div>
      <Message mutation={exportMutation} />
      <section className={panel}>
        <input
          aria-label="Search leads"
          placeholder="Search lead ID, company, contact, phone or email"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
            setSelected([]);
          }}
          className={input}
        />
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold">
            Filters & columns
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['stage', metadata.data?.stages],
              ['source', metadata.data?.sources],
              ['priority', metadata.data?.priorities],
              ['temperature', metadata.data?.temperatures],
              ['service', metadata.data?.serviceCatalog.map((item) => item.id)],
            ].map(([key, values]) => (
              <Field key={key} label={label(key)}>
                <select
                  value={draft[key] || ''}
                  className={input}
                  onChange={(event) =>
                    setDraft({ ...draft, [key]: event.target.value })
                  }
                >
                  <option value="">All</option>
                  {values?.map((value) => (
                    <option key={value} value={value}>
                      {label(value)}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
            <Field label="Assigned employee">
              <AssigneeSelect
                value={draft.assignedTo}
                onChange={(value) => setDraft({ ...draft, assignedTo: value })}
              />
            </Field>
            <Field label="City">
              <input
                className={input}
                value={draft.city || ''}
                onChange={(event) =>
                  setDraft({ ...draft, city: event.target.value })
                }
              />
            </Field>
            {[
              ['from', 'Created from'],
              ['to', 'Created until'],
              ['followFrom', 'Follow-up from'],
              ['followTo', 'Follow-up until'],
              ['closeFrom', 'Closing from'],
              ['closeTo', 'Closing until'],
            ].map(([key, title]) => (
              <Field key={key} label={title}>
                <input
                  type="date"
                  className={input}
                  value={draft[key] || ''}
                  onChange={(event) =>
                    setDraft({ ...draft, [key]: event.target.value })
                  }
                />
              </Field>
            ))}
          </div>
          <div className="my-4 flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setFilters(
                  Object.fromEntries(
                    Object.entries(draft)
                      .filter(([, value]) => value)
                      .map(([key, value]) => [
                        key,
                        /^(from|to|followFrom|followTo|closeFrom|closeTo)$/.test(
                          key,
                        )
                          ? `${value}T${/To$|^to$/.test(key) ? '23:59:59.999' : '00:00:00'}+05:30`
                          : value,
                      ]),
                  ),
                );
                setPage(1);
                setSelected([]);
              }}
            >
              Apply Filters
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setDraft({});
                setFilters({});
                setPage(1);
              }}
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {columns.map((key) => (
              <label key={key} className="text-[10px]">
                <input
                  type="checkbox"
                  checked={visible.includes(key)}
                  onChange={(event) =>
                    setVisible(
                      event.target.checked
                        ? [...visible, key]
                        : visible.filter((value) => value !== key),
                    )
                  }
                />{' '}
                {label(key)}
              </label>
            ))}
          </div>
        </details>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => (
            <span
              key={key}
              className="rounded-full bg-sky-50 px-3 py-1 text-[10px]"
            >
              {label(key)}: {key === 'assignedTo' ? 'Selected employee' : value}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <label>
            Sort{' '}
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="rounded border p-2"
            >
              {[
                'createdAt',
                'companyName',
                'estimatedBudget',
                'nextFollowUpAt',
                'updatedAt',
              ].map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </select>
          </label>
          <select
            aria-label="Sort direction"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
            className="rounded border p-2"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          {can(permissions, 'crm.leads.bulk_assign') && (
            <Button
              size="sm"
              variant="secondary"
              disabled={!selected.length}
              onClick={() => setAssign(true)}
            >
              Assign selected ({selected.length})
            </Button>
          )}
        </div>
      </section>
      <QueryState query={query}>
        <section className={panel}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-[11px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3">
                    <input
                      aria-label="Select all leads on page"
                      type="checkbox"
                      checked={
                        Boolean(query.data?.items.length) &&
                        selected.length === query.data?.items.length
                      }
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? query.data.items.map((item) => item._id)
                            : [],
                        )
                      }
                    />
                  </th>
                  {visible.map((key) => (
                    <th key={key} className="p-3 whitespace-nowrap">
                      {label(key)}
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.items.map((lead) => (
                  <tr key={lead._id} className="border-t border-slate-100">
                    <td className="p-3">
                      <input
                        aria-label={`Select ${lead.leadId}`}
                        type="checkbox"
                        checked={selected.includes(lead._id)}
                        onChange={(event) =>
                          setSelected(
                            event.target.checked
                              ? [...selected, lead._id]
                              : selected.filter((value) => value !== lead._id),
                          )
                        }
                      />
                    </td>
                    {visible.map((key) => (
                      <td key={key} className="max-w-60 px-3 py-4">
                        {render(lead, key)}
                      </td>
                    ))}
                    <td>
                      <Link
                        className="text-blue-700"
                        to={`/crm/leads/${lead._id}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!query.data?.items.length && (
              <p className="py-10 text-center text-sm text-slate-500">
                No leads found
              </p>
            )}
          </div>
          <Pager
            pagination={query.data?.pagination}
            page={page}
            onPage={(value) => {
              setPage(value);
              setSelected([]);
            }}
          />
        </section>
      </QueryState>
      {create && <LeadForm onClose={() => setCreate(false)} />}
      {importOpen && <LeadImportDialog onClose={() => setImportOpen(false)} />}
      {assign && (
        <HRMSDialog
          open
          onOpenChange={setAssign}
          title="Assign selected leads"
          description="All selected leads must be within your access scope."
        >
          <AssigneeSelect value={owner} onChange={setOwner} required />
          <Message mutation={mutation} />
          <Button
            className="mt-4"
            disabled={!owner || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Assign leads
          </Button>
        </HRMSDialog>
      )}
    </div>
  );
}
