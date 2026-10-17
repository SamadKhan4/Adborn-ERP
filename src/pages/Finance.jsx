import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  WalletCards,
  CreditCard,
  Receipt,
  Building2,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  CalendarClock,
  Plus,
  Download,
  Settings2,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api.js';
import FinanceForm from '../components/finance/FinanceForm.jsx';
import FinanceAccess from '../components/finance/FinanceAccess.jsx';
import ExpenseDetail from '../components/finance/ExpenseDetail.jsx';
import {
  financePanel as panel,
  financeInput as input,
  financeButton as button,
  has,
  money,
  day,
  label,
  FinanceState,
  FinanceBadge,
  FinanceTable,
  FinanceBars,
  FinanceDonut,
} from '../components/finance/FinanceShared.jsx';
import { datePreset } from '../components/reports/ReportShared.jsx';
const modules = [
  [
    'invoices',
    'Invoices',
    'Create, manage and track invoices.',
    FileText,
    'finance.invoices.view',
  ],
  [
    'payments',
    'Payments',
    'Record and track client receipts.',
    CreditCard,
    'finance.payments.view',
  ],
  [
    'expenses',
    'Expenses',
    'Approve and allocate business costs.',
    WalletCards,
    'finance.expenses.view',
  ],
  [
    'outstanding',
    'Outstanding',
    'Track pending payments.',
    Receipt,
    'finance.outstanding.view',
  ],
  [
    'ledger',
    'Client Ledger',
    'Client-wise financial summary.',
    Building2,
    'finance.ledger.view',
  ],
  [
    'recurring',
    'Recurring Billing',
    'Manage billing cycles.',
    CalendarClock,
    'finance.recurring.view',
  ],
  [
    'reports',
    'Reports',
    'Financial exports and analytics.',
    BarChart3,
    'finance.reports.view',
  ],
  [
    'profitability',
    'Profitability',
    'Recorded direct contribution.',
    TrendingUp,
    'finance.profitability.view',
  ],
];
const clean = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) => item !== '' && item !== undefined,
    ),
  );
const statusSets = {
  invoices: ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
  outstanding: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'],
  payments: ['POSTED', 'REVERSED'],
  expenses: [
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'PAID',
    'REJECTED',
    'CANCELLED',
  ],
  recurring: ['ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED'],
  followups: ['PENDING', 'COMPLETED', 'RESCHEDULED', 'MISSED'],
};
const invoiceColumns = [
  [
    'invoiceNumber',
    'Invoice',
    (row) => (
      <Link
        className="font-semibold text-[#087dda]"
        to={`/finance/invoices/${row._id}`}
      >
        {row.invoiceNumber}
      </Link>
    ),
  ],
  ['client', 'Client', (row) => row.client?.company],
  ['invoiceDate', 'Invoice Date', (row) => day(row.invoiceDate)],
  ['dueDate', 'Due Date', (row) => day(row.dueDate)],
  ['totalMinor', 'Billed', (row) => money(row.totalMinor)],
  ['paidMinor', 'Paid', (row) => money(row.paidMinor)],
  ['balanceMinor', 'Balance', (row) => money(row.balanceMinor)],
  [
    'financeStatus',
    'Status',
    (row) => <FinanceBadge value={row.financeStatus} />,
  ],
  ['daysOverdue', 'Days Overdue'],
];
const paymentColumns = [
  ['paymentId', 'Payment'],
  ['invoice', 'Invoice', (row) => row.invoice?.invoiceNumber || '—'],
  ['paymentDate', 'Received On', (row) => day(row.paymentDate)],
  ['amountMinor', 'Amount', (row) => money(row.amountMinor)],
  ['method', 'Method', (row) => label(row.method)],
  ['status', 'Status', (row) => <FinanceBadge value={row.status} />],
];
const expenseColumns = [
  ['expenseId', 'Expense'],
  ['date', 'Date', (row) => day(row.date)],
  ['category', 'Category'],
  ['vendor', 'Vendor'],
  ['description', 'Description'],
  ['totalMinor', 'Total', (row) => money(row.totalMinor)],
  ['status', 'Status', (row) => <FinanceBadge value={row.status} />],
];
const recurringColumns = [
  ['client', 'Client', (row) => row.client?.companyName],
  ['description', 'Service'],
  ['frequency', 'Frequency', (row) => label(row.frequency)],
  ['nextBillingDate', 'Next Billing', (row) => day(row.nextBillingDate)],
  ['amountMinor', 'Base Amount', (row) => money(row.amountMinor)],
  ['status', 'Status', (row) => <FinanceBadge value={row.status} />],
  ['lastError', 'Review Note'],
];
export default function Finance() {
  const location = useLocation();
  return <FinanceContent key={location.pathname} />;
}
function FinanceContent() {
  const location = useLocation(),
    parts = location.pathname.split('/').filter(Boolean),
    section = parts[1] || 'dashboard',
    invoiceId = parts[2];
  const [filters, setFilters] = useState(() =>
      section === 'dashboard' ? datePreset('month') : {},
    ),
    [draft, setDraft] = useState(() =>
      section === 'dashboard' ? datePreset('month') : {},
    ),
    [range, setRange] = useState(section === 'dashboard' ? 'month' : 'all'),
    [page, setPage] = useState(1),
    [dialog, setDialog] = useState(null),
    [notice, setNotice] = useState(''),
    [tab, setTab] = useState('details'),
    [format, setFormat] = useState('csv'),
    [report, setReport] = useState('invoices'),
    [hiddenColumns, setHiddenColumns] = useState([]);
  const client = useQueryClient();
  const metadata = useQuery({
    queryKey: ['financeMetadata'],
    queryFn: async ({ signal }) =>
      (await api.get('/finance/metadata', { signal })).data.data,
    staleTime: 30000,
  });
  const permissions = metadata.data?.permissions || [],
    allowed = (key) => has(permissions, key);
  const sectionPermission =
    section === 'dashboard'
      ? 'finance.dashboard.view'
      : section === 'followups'
        ? 'finance.outstanding.view'
        : modules.find(([key]) => key === section)?.[4];
  const query = useQuery({
    queryKey: ['finance', section, filters, page],
    enabled:
      metadata.isSuccess &&
      !invoiceId &&
      section !== 'reports' &&
      allowed(sectionPermission) &&
      (section !== 'ledger' || Boolean(filters.client)),
    queryFn: async ({ signal }) =>
      (
        await api.get(
          `/finance/${section === 'dashboard' ? 'dashboard' : section}`,
          { signal, params: { ...clean(filters), page, limit: 20 } },
        )
      ).data.data,
    refetchInterval: section === 'dashboard' ? 60000 : false,
  });
  const detail = useQuery({
    queryKey: ['financeInvoice', invoiceId],
    enabled:
      Boolean(invoiceId) &&
      metadata.isSuccess &&
      allowed('finance.invoices.view'),
    queryFn: async ({ signal }) =>
      (await api.get(`/finance/invoices/${invoiceId}`, { signal })).data.data,
  });
  const settings = useQuery({
    queryKey: ['financeSettings'],
    enabled: allowed('finance.settings.manage'),
    queryFn: async ({ signal }) =>
      (await api.get('/finance/settings', { signal })).data.data,
  });
  const action = useMutation({
    mutationFn: ({ path, body }) => api.post(`/finance${path}`, body || {}),
    onSuccess: () => {
      ['finance', 'financeInvoice', 'reports', 'reportDetail'].forEach((key) =>
        client.invalidateQueries({ queryKey: [key] }),
      );
      setNotice('Action completed successfully.');
    },
  });
  const download = useMutation({
    mutationFn: async ({ path, name, preview }) => {
      let response;
      try {
        response = await api.get(`/finance${path}`, {
          responseType: 'blob',
          timeout: 60000,
        });
      } catch (error) {
        if (error.response?.data instanceof Blob) {
          try {
            const data = JSON.parse(await error.response.data.text());
            throw new Error(data.error?.message || 'Download failed');
          } catch (failure) {
            if (!(failure instanceof SyntaxError)) throw failure;
          }
        }
        throw error;
      }
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      if (preview) {
        anchor.target = '_blank';
        anchor.rel = 'noopener';
      } else anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    },
  });
  const show = (mode, row) => setDialog({ mode, row });
  const close = (message) => {
    setDialog(null);
    if (message) setNotice(message);
    client.invalidateQueries({ queryKey: ['financeSettings'] });
  };
  const post = (path, body) => action.mutate({ path, body });
  const invoice = detail.data?.invoice,
    data = query.data,
    totals = data?.totals || {};
  const exportKey =
    section === 'reports'
      ? report
      : section === 'ledger'
        ? 'ledger'
        : section === 'outstanding'
          ? 'outstanding'
          : ['invoices', 'expenses', 'payments'].includes(section)
            ? section
            : report;
  const tableColumns =
    section === 'payments'
      ? paymentColumns
      : section === 'expenses'
        ? expenseColumns
        : section === 'recurring'
          ? recurringColumns
          : section === 'ledger'
            ? [
                ['date', 'Date', (row) => day(row.date)],
                ['particular', 'Particular'],
                ['reference', 'Reference'],
                ['debitMinor', 'Debit', (row) => money(row.debitMinor)],
                ['creditMinor', 'Credit', (row) => money(row.creditMinor)],
                ['balanceMinor', 'Balance', (row) => money(row.balanceMinor)],
              ]
            : section === 'profitability'
              ? [
                  ['allocation', 'Allocation'],
                  ['billedMinor', 'Billed', (row) => money(row.billedMinor)],
                  [
                    'taxableMinor',
                    'Pre-GST Revenue',
                    (row) => money(row.taxableMinor),
                  ],
                  [
                    'directCostMinor',
                    'Recorded Cost',
                    (row) =>
                      row.directCostMinor === null
                        ? 'Unavailable'
                        : money(row.directCostMinor),
                  ],
                  [
                    'contributionMinor',
                    'Direct Contribution',
                    (row) =>
                      row.contributionMinor === null
                        ? 'Unavailable'
                        : money(row.contributionMinor),
                  ],
                  ['status', 'Cost Coverage'],
                ]
              : section === 'followups'
                ? [
                    ['invoice', 'Invoice', (row) => row.invoice?.invoiceNumber],
                    ['type', 'Type'],
                    ['date', 'Date', (row) => day(row.date)],
                    ['notes', 'Notes'],
                    [
                      'nextFollowUpAt',
                      'Next Follow-up',
                      (row) => day(row.nextFollowUpAt),
                    ],
                    [
                      'status',
                      'Status',
                      (row) => <FinanceBadge value={row.status} />,
                    ],
                  ]
                : invoiceColumns;
  const actions = (row) => (
    <>
      {(section === 'invoices' || section === 'outstanding') && (
        <>
          <Link to={`/finance/invoices/${row._id}`}>View</Link>
          {allowed('finance.payments.create') && row.balanceMinor > 0 && (
            <button onClick={() => show('payment', row)}>Record payment</button>
          )}
          {allowed('finance.followups.manage') && (
            <button onClick={() => show('followup', row)}>Follow-up</button>
          )}
        </>
      )}
      {section === 'payments' &&
        row.status === 'POSTED' &&
        allowed('finance.payments.reverse') && (
          <button onClick={() => show('reverse', row)}>Reverse</button>
        )}
      {section === 'expenses' && (
        <><button onClick={() => show('expenseDetails', row)}>View</button>
          {allowed('finance.expenses.edit') &&
            ['DRAFT', 'REJECTED'].includes(row.status) && (
              <>
                <button onClick={() => show('editExpense', row)}>Edit</button>
                <button
                  disabled={action.isPending}
                  onClick={() =>
                    post(`/expenses/${row._id}/action`, {
                      action: 'submit',
                      revision: row.revision,
                    })
                  }
                >
                  Submit
                </button>
              </>
            )}
          {allowed('finance.expenses.approve') &&
            row.status === 'PENDING_APPROVAL' && (
              <>
                <button
                  disabled={action.isPending}
                  onClick={() =>
                    post(`/expenses/${row._id}/action`, {
                      action: 'approve',
                      revision: row.revision,
                    })
                  }
                >
                  Approve
                </button>
                <button
                  disabled={action.isPending}
                  onClick={() =>
                    post(`/expenses/${row._id}/action`, {
                      action: 'reject',
                      revision: row.revision,
                    })
                  }
                >
                  Reject
                </button>
              </>
            )}
          {allowed('finance.expenses.edit') && row.status === 'APPROVED' && (
            <button
              disabled={action.isPending}
              onClick={() =>
                post(`/expenses/${row._id}/action`, {
                  action: 'pay',
                  revision: row.revision,
                })
              }
            >
              Mark paid
            </button>
          )}
          {allowed('finance.expenses.edit') &&
            !['PAID', 'CANCELLED'].includes(row.status) && (
              <button
                disabled={action.isPending}
                onClick={() =>
                  post(`/expenses/${row._id}/action`, {
                    action: 'cancel',
                    revision: row.revision,
                  })
                }
              >
                Cancel
              </button>
            )}
          {allowed('finance.expenses.edit') && (
            <button
              onClick={() => show('document', { ...row, kind: 'expense' })}
            >
              Receipt
            </button>
          )}
        </>
      )}
      {section === 'recurring' && allowed('finance.recurring.manage') && (
        <>
          <button onClick={() => show('editRecurring', row)}>Edit</button>
          {row.status === 'ACTIVE' && allowed('finance.invoices.create') && (
            <button
              disabled={action.isPending}
              onClick={() =>
                post(`/recurring/${row._id}/generate`, {
                  period: row.nextBillingDate,
                })
              }
            >
              Generate invoice
            </button>
          )}
        </>
      )}
      {section === 'followups' && allowed('finance.followups.manage') && (
        <button onClick={() => show('editFollowup', row)}>
          Edit follow-up
        </button>
      )}
    </>
  );
  return (
    <main className="space-y-5 text-[#173958]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#101450] sm:text-3xl">
            {invoice
              ? invoice.invoiceNumber
              : section === 'dashboard'
                ? 'Finance Management'
                : section === 'ledger'
                  ? 'Client Ledger'
                  : section === 'reports'
                    ? 'Finance Reports'
                    : label(section)}
          </h1>
          <p className="mt-2 text-xs text-[#7184aa]">
            Track billing, collections, outstanding payments, expenses and
            financial health.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {allowed('finance.invoices.create') && (
            <button className={button} onClick={() => show('invoice')}>
              <Plus size={14} />
              Create Invoice
            </button>
          )}
          {allowed('finance.payments.create') && (
            <button className={button} onClick={() => show('payment', invoice)}>
              <CreditCard size={14} />
              Record Payment
            </button>
          )}
          {allowed('finance.expenses.create') && (
            <button className={button} onClick={() => show('expense')}>
              <Plus size={14} />
              Add Expense
            </button>
          )}
          {allowed('finance.settings.manage') && (
            <button
              aria-label="Finance settings"
              className={`${input} w-auto!`}
              disabled={settings.isPending}
              onClick={() => show('settings', settings.data)}
            >
              <Settings2 size={17} />
            </button>
          )}
          {allowed('finance.settings.manage') && (
            <button
              className={`${input} w-auto!`}
              onClick={() => setDialog({ mode: 'access' })}
            >
              Finance Access
            </button>
          )}
        </div>
      </header>
      <nav
        aria-label="Finance navigation"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        <Link
          to="/finance"
          className={`${input} w-auto! shrink-0 ${section === 'dashboard' ? 'bg-[#e8f5ff]!' : ''}`}
        >
          Overview
        </Link>
        {modules
          .filter(([, , , , permission]) => allowed(permission))
          .map(([key, title]) => (
            <Link
              key={key}
              to={`/finance/${key}`}
              aria-current={section === key ? 'page' : undefined}
              className={`${input} w-auto! shrink-0 whitespace-nowrap ${section === key ? 'bg-[#e8f5ff]! font-semibold' : ''}`}
            >
              {title}
            </Link>
          ))}
        {allowed('finance.outstanding.view') && (
          <Link
            to="/finance/followups"
            className={`${input} w-auto! shrink-0 whitespace-nowrap`}
          >
            Payment Follow-ups
          </Link>
        )}
      </nav>
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-[#edf9f2] p-3 text-xs text-[#24835a]"
        >
          {notice}
        </p>
      )}
      {(action.isError || download.isError) && (
        <p role="alert" className="text-sm text-red-600">
          {action.error?.response?.data?.error?.message ||
            download.error?.message ||
            'Unable to complete finance action.'}
        </p>
      )}
      <FinanceState query={metadata}>
        {metadata.data &&
        !allowed(sectionPermission || 'finance.invoices.view') ? (
          <p role="alert" className={panel}>
            You do not have permission to access this finance section.
          </p>
        ) : (
          <>
            {!metadata.data?.settings?.companyName &&
              allowed('finance.settings.manage') && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f0d9a7] bg-[#fffaf0] p-4 text-xs">
                  <span>
                    Set up company GST/state and bank details before creating
                    invoices.
                  </span>
                  <button
                    className="font-semibold text-[#087dda]"
                    onClick={() => show('settings', settings.data)}
                  >
                    Complete finance settings →
                  </button>
                </div>
              )}
            {!invoiceId && (
              <form
                className={`${panel} flex flex-wrap items-end gap-3`}
                onSubmit={(event) => {
                  event.preventDefault();
                  setFilters(clean(draft));
                  setPage(1);
                }}
              >
                <label className="text-[10px] text-[#7184aa]">
                  Date range
                  <select
                    className={`${input} mt-1`}
                    value={range}
                    onChange={(event) => {
                      setRange(event.target.value);
                      const dates = datePreset(event.target.value);
                      setDraft({
                        ...draft,
                        from: dates.from || '',
                        to: dates.to || '',
                      });
                    }}
                  >
                    {[
                      ['all', 'All dates'],
                      ['today', 'Today'],
                      ['week', 'This Week'],
                      ['month', 'This Month'],
                      ['last-month', 'Last Month'],
                      ['quarter', 'Quarter'],
                      ['financial-year', 'Financial Year'],
                      ['custom', 'Custom Range'],
                    ].map(([value, title]) => (
                      <option key={value} value={value}>
                        {title}
                      </option>
                    ))}
                  </select>
                </label>
                {['from', 'to'].map((field) => (
                  <label className="text-[10px] text-[#7184aa]" key={field}>
                    {label(field)}
                    <input
                      aria-label={`${label(field)} date`}
                      className={`${input} mt-1`}
                      type="date"
                      value={draft[field] || ''}
                      onChange={(event) => {
                        setRange('custom');
                        setDraft({ ...draft, [field]: event.target.value });
                      }}
                    />
                  </label>
                ))}
                <label className="text-[10px] text-[#7184aa]">
                  Client
                  <select
                    aria-label="Client filter"
                    className={`${input} mt-1 max-w-52`}
                    value={draft.client || ''}
                    onChange={(event) =>
                      setDraft({ ...draft, client: event.target.value })
                    }
                  >
                    <option value="">
                      {section === 'ledger' ? 'Select client' : 'All clients'}
                    </option>
                    {metadata.data?.clients.map((row) => (
                      <option key={row._id} value={row._id}>
                        {row.companyName}
                      </option>
                    ))}
                  </select>
                </label>
                {section !== 'dashboard' && (
                  <>
                    <label className="text-[10px] text-[#7184aa]">
                      Search
                      <input
                        aria-label="Search finance"
                        className={`${input} mt-1`}
                        value={draft.search || ''}
                        maxLength={100}
                        onChange={(event) =>
                          setDraft({ ...draft, search: event.target.value })
                        }
                      />
                    </label>
                    {statusSets[section] && (
                      <label className="text-[10px] text-[#7184aa]">
                        Status
                        <select
                          className={`${input} mt-1`}
                          value={draft.status || ''}
                          onChange={(event) =>
                            setDraft({ ...draft, status: event.target.value })
                          }
                        >
                          <option value="">All</option>
                          {statusSets[section].map((status) => (
                            <option key={status} value={status}>
                              {label(status)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {['invoices', 'outstanding'].includes(section) && (
                      <label className="text-[10px] text-[#7184aa]">
                        Due
                        <select
                          className={`${input} mt-1`}
                          value={draft.due || ''}
                          onChange={(event) =>
                            setDraft({ ...draft, due: event.target.value })
                          }
                        >
                          <option value="">Any due date</option>
                          {['today', 'upcoming', 'overdue', 'severe'].map(
                            (value) => (
                              <option key={value} value={value}>
                                {label(value)}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                    )}
                  </>
                )}
                <details className="text-xs"><summary className={`${input} cursor-pointer`}>More filters</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">{['invoices','outstanding'].includes(section)&&['minAmount','maxAmount'].map((field)=><label key={field} className="text-[10px]">{field==='minAmount'?'Minimum billed INR':'Maximum billed INR'}<input type="number" min="0" step="0.01" className={`${input} mt-1`} value={draft[field]||''} onChange={(event)=>setDraft({...draft,[field]:event.target.value})}/></label>)}{['expenses','profitability','invoices'].includes(section)&&<label className="text-[10px]">Project<select className={`${input} mt-1`} value={draft.project||''} onChange={(event)=>setDraft({...draft,project:event.target.value})}><option value="">All projects</option>{metadata.data?.projects.map((row)=><option key={row._id} value={row._id}>{row.title}</option>)}</select></label>}{section==='expenses'&&<><label className="text-[10px]">Category<select className={`${input} mt-1`} value={draft.category||''} onChange={(event)=>setDraft({...draft,category:event.target.value})}><option value="">All categories</option>{metadata.data?.expenseCategories.map((value)=><option key={value}>{value}</option>)}</select></label><label className="text-[10px]">Department<select className={`${input} mt-1`} value={draft.department||''} onChange={(event)=>setDraft({...draft,department:event.target.value})}><option value="">All departments</option>{metadata.data?.departments.map((row)=><option key={row.key} value={row.key}>{row.name}</option>)}</select></label><label className="text-[10px]">Employee<select className={`${input} mt-1`} value={draft.employee||''} onChange={(event)=>setDraft({...draft,employee:event.target.value})}><option value="">All employees</option>{metadata.data?.users.map((row)=><option key={row._id} value={row._id}>{row.name}</option>)}</select></label></>}{section==='payments'&&<label className="text-[10px]">Method<select className={`${input} mt-1`} value={draft.method||''} onChange={(event)=>setDraft({...draft,method:event.target.value})}><option value="">All methods</option>{metadata.data?.methods.map((value)=><option key={value}>{value}</option>)}</select></label>}</div></details>
                <button className={button}>Apply filters</button>
                <button
                  type="button"
                  className="text-xs text-[#087dda]"
                  onClick={() => {
                    setDraft({});
                    setFilters({});
                    setRange('all');
                    setPage(1);
                  }}
                >
                  Reset
                </button>
                {query.isSuccess && (
                  <button
                    type="button"
                    aria-label="Refresh finance data"
                    onClick={() => query.refetch()}
                    className="p-2 text-[#087dda]"
                  >
                    <RefreshCw size={15} />
                  </button>
                )}
              </form>
            )}
            {section === 'dashboard' && (
              <FinanceState query={query}>
                {data && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                      {[
                        [
                          'Total Billed',
                          totals.billedMinor,
                          FileText,
                          '#087dda',
                        ],
                        [
                          'Collected Revenue',
                          totals.collectedMinor,
                          CreditCard,
                          '#12b988',
                        ],
                        [
                          'Outstanding',
                          totals.outstandingMinor,
                          Receipt,
                          '#ff9429',
                        ],
                        [
                          'Overdue',
                          totals.overdueMinor,
                          CalendarClock,
                          '#f3517f',
                        ],
                        [
                          'Approved Expenses',
                          totals.expenseMinor,
                          WalletCards,
                          '#f3517f',
                        ],
                        [
                          'Net Cash Movement',
                          totals.netCashMinor,
                          ShieldCheck,
                          '#9170f7',
                        ],
                      ].map(([title, value, Icon, color]) => (
                        <div className={panel} key={title}>
                          <div className="mb-3 flex items-center gap-2">
                            <span
                              className="grid size-10 shrink-0 place-items-center rounded-xl"
                              style={{ background: `${color}14`, color }}
                            >
                              <Icon size={23} />
                            </span>
                            <span className="text-[10px] text-[#7184aa]">
                              {title}
                            </span>
                          </div>
                          <strong className="block text-xl font-extrabold tracking-tight text-[#101450]">
                            {money(value)}
                          </strong>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                      {modules
                        .filter(([, , , , permission]) => allowed(permission))
                        .map(([key, title, description, Icon], index) => (
                          <Link
                            className={`${panel} flex items-start gap-3 p-4!`}
                            key={key}
                            to={`/finance/${key}`}
                          >
                            <span
                              className="grid size-10 shrink-0 place-items-center rounded-xl"
                              style={{
                                background: [
                                  '#e9f5ff',
                                  '#e3faef',
                                  '#fff0f3',
                                  '#fff2e0',
                                  '#f0eaff',
                                ][index % 5],
                                color: [
                                  '#087dda',
                                  '#13b981',
                                  '#f3517f',
                                  '#ff9429',
                                  '#9672ed',
                                ][index % 5],
                              }}
                            >
                              <Icon size={22} />
                            </span>
                            <div>
                              <h2 className="text-xs font-bold text-[#101450]">
                                {title}
                              </h2>
                              <p className="mt-1 text-[9px] leading-4 text-[#7184aa]">
                                {description}
                              </p>
                            </div>
                          </Link>
                        ))}
                    </div>
                    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
                      <section className={panel}>
                        <h2 className="mb-4 text-sm font-bold text-[#101450]">
                          Billed Revenue vs Collections
                        </h2>
                        <div className="mb-3 flex gap-4 text-[10px]">
                          <span className="text-[#087dda]">● Billed</span>
                          <span className="text-[#16bb99]">● Received</span>
                        </div>
                        <FinanceBars
                          rows={data.months}
                          series={[
                            ['billedMinor', 'Billed', '#087dda'],
                            ['receivedMinor', 'Received', '#16bb99'],
                          ]}
                        />
                      </section>
                      <section className={panel}>
                        <h2 className="text-sm font-bold text-[#101450]">
                          Billed Service Sources
                        </h2>
                        <FinanceDonut
                          rows={data.services}
                          title="Service revenue"
                        />
                      </section>
                      <section className={panel}>
                        <h2 className="text-sm font-bold text-[#101450]">
                          Expense Breakdown
                        </h2>
                        <FinanceDonut
                          rows={data.expenseCategories}
                          title="Expenses"
                        />
                      </section>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
                      <section className={panel}>
                        <div className="mb-4 flex justify-between">
                          <h2 className="text-sm font-bold text-[#101450]">
                            Recent Payments
                          </h2>
                          {allowed('finance.payments.view') && (
                            <Link
                              className="text-xs text-[#087dda]"
                              to="/finance/payments"
                            >
                              View all →
                            </Link>
                          )}
                        </div>
                        <FinanceTable
                          columns={[
                            [
                              'paymentDate',
                              'Date',
                              (row) => day(row.paymentDate),
                            ],
                            ['paymentId', 'Reference'],
                            ['method', 'Method', (row) => label(row.method)],
                            [
                              'amountMinor',
                              'Amount',
                              (row) => money(row.amountMinor),
                            ],
                            [
                              'status',
                              'Status',
                              (row) => <FinanceBadge value={row.status} />,
                            ],
                          ]}
                          items={data.recentPayments}
                        />
                      </section>
                      <section className={panel}>
                        <div className="mb-4 flex justify-between">
                          <h2 className="text-sm font-bold text-[#101450]">
                            Outstanding Invoices
                          </h2>
                          {allowed('finance.outstanding.view') && (
                            <Link
                              className="text-xs text-[#087dda]"
                              to="/finance/outstanding"
                            >
                              View all →
                            </Link>
                          )}
                        </div>
                        <FinanceTable
                          columns={[
                            invoiceColumns[0],
                            invoiceColumns[1],
                            invoiceColumns[3],
                            invoiceColumns[6],
                            invoiceColumns[7],
                          ]}
                          items={data.outstanding}
                        />
                      </section>
                      <section className={panel}>
                        <h2 className="mb-4 text-sm font-bold text-[#101450]">
                          Client-wise Revenue
                        </h2>
                        <FinanceTable
                          columns={[
                            ['company', 'Client'],
                            [
                              'billedMinor',
                              'Billed',
                              (row) => money(row.billedMinor),
                            ],
                            [
                              'paidMinor',
                              'Settled',
                              (row) => money(row.paidMinor),
                            ],
                            [
                              'balanceMinor',
                              'Outstanding',
                              (row) => (
                                <span className="text-red-500">
                                  {money(row.balanceMinor)}
                                </span>
                              ),
                            ],
                          ]}
                          items={data.clients}
                        />
                      </section>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      <section className={panel}>
                        <h2 className="mb-4 text-sm font-bold">
                          Revenue vs Approved Expenses
                        </h2>
                        <FinanceBars
                          rows={data.months}
                          series={[
                            ['billedMinor', 'Billed', '#087dda'],
                            ['expenseMinor', 'Expenses', '#ff7595'],
                          ]}
                        />
                      </section>
                      <section className={panel}>
                        <h2 className="text-sm font-bold">Outstanding Aging</h2>
                        <FinanceDonut rows={data.aging} title="Outstanding" />
                        <div className="flex flex-wrap gap-4 text-xs">
                          <span>
                            Due today: <strong>{totals.dueToday}</strong>
                          </span>
                          <span>
                            Partially paid:{' '}
                            <strong>{totals.partiallyPaid}</strong>
                          </span>
                          <span>
                            Recurring contracts:{' '}
                            <strong>{totals.recurring}</strong>
                          </span>
                        </div>
                      </section>
                    </div>
                    <p className="text-[10px] leading-5 text-[#7184aa]">
                      {data.basis}
                      {totals.legacyPaidMinor > 0 &&
                        ` Legacy settled invoice value: ${money(totals.legacyPaidMinor)} (not receipt-date collections).`}
                    </p>
                  </>
                )}
              </FinanceState>
            )}
            {invoiceId && (
              <FinanceState query={detail}>
                {invoice && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-4">
                      {[
                        ['Client', invoice.client.company],
                        ['Billed', money(invoice.totalMinor)],
                        ['Paid', money(invoice.paidMinor)],
                        ['Balance', money(invoice.balanceMinor)],
                      ].map(([title, value]) => (
                        <div key={title} className={panel}>
                          <p className="text-xs text-[#7184aa]">{title}</p>
                          <strong className="mt-3 block text-xl">
                            {value}
                          </strong>
                        </div>
                      ))}
                    </div>
                    <div
                      className={`${panel} flex flex-wrap items-center gap-3`}
                    >
                      <FinanceBadge value={invoice.financeStatus} />
                      {allowed('finance.invoices.export') && (
                        <>
                          <button
                            className={button}
                            onClick={() =>
                              download.mutate({
                                path: `/invoices/${invoiceId}/pdf?disposition=inline`,
                                preview: true,
                              })
                            }
                          >
                            Preview PDF
                          </button>
                          <button
                            className={button}
                            onClick={() =>
                              download.mutate({
                                path: `/invoices/${invoiceId}/pdf`,
                                name: `invoice-${invoiceId}.pdf`,
                              })
                            }
                          >
                            Download PDF
                          </button>
                        </>
                      )}
                      {allowed('finance.invoices.edit') &&
                        invoice.financeStatus === 'DRAFT' && (
                          <>
                            <button
                              className={button}
                              onClick={() => show('editInvoice', invoice)}
                            >
                              Edit draft
                            </button>
                            <button
                              className={button}
                              disabled={action.isPending}
                              onClick={() =>
                                post(`/invoices/${invoiceId}/send`, {
                                  email: false,
                                })
                              }
                            >
                              Issue invoice
                            </button>
                            <button
                              className={button}
                              disabled={action.isPending}
                              onClick={() =>
                                post(`/invoices/${invoiceId}/send`, {
                                  email: true,
                                })
                              }
                            >
                              Issue & email PDF
                            </button>
                          </>
                        )}
                      {allowed('finance.invoices.create') && (
                        <button
                          className={button}
                          onClick={() => show('invoice', invoice)}
                        >
                          Duplicate
                        </button>
                      )}
                      {allowed('finance.payments.create') &&
                        invoice.balanceMinor > 0 && (
                          <button
                            className={button}
                            onClick={() => show('payment', invoice)}
                          >
                            Record Payment
                          </button>
                        )}
                      {allowed('finance.invoices.cancel') &&
                        invoice.financeStatus !== 'CANCELLED' && (
                          <button
                            className="text-xs text-red-500"
                            onClick={() => show('cancel', invoice)}
                          >
                            Cancel invoice
                          </button>
                        )}
                    </div>
                    <section className={panel}>
                      <nav className="mb-5 flex gap-3 overflow-x-auto">
                        {[
                          'details',
                          'items',
                          'payments',
                          'activity',
                          'documents',
                          'followups',
                        ].map((value) => (
                          <button
                            key={value}
                            className={`${input} w-auto! shrink-0 ${tab === value ? 'bg-[#eaf6ff]! font-bold' : ''}`}
                            onClick={() => setTab(value)}
                          >
                            {label(value)}
                          </button>
                        ))}
                      </nav>
                      {tab === 'details' && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <p className="text-xs leading-6">
                            <strong>{invoice.client.company}</strong>
                            <br />
                            {invoice.client.address}
                            <br />
                            {invoice.client.email}
                            <br />
                            GSTIN: {invoice.gstin || 'Not supplied'}
                            <br />
                            State: {invoice.stateCode || 'Not supplied'}
                          </p>
                          <p className="text-xs leading-6">
                            Invoice date: {day(invoice.invoiceDate)}
                            <br />
                            Due date: {day(invoice.dueDate)}
                            <br />
                            Tax type: {invoice.taxType || 'Legacy invoice'}
                            <br />
                            CGST: {money(invoice.cgstMinor)} · SGST:{' '}
                            {money(invoice.sgstMinor)} · IGST:{' '}
                            {money(invoice.igstMinor)}
                            <br />
                            Reference: {invoice.reference || '—'}
                            <br />
                            {invoice.notes}
                          </p>
                          {invoice.clientRef &&
                            allowed('finance.invoices.edit') && (
                              <button
                                className={button}
                                onClick={() =>
                                  show('tax', {
                                    _id: invoice.clientRef,
                                    gstin: invoice.gstin,
                                    stateCode: invoice.stateCode,
                                  })
                                }
                              >
                                Update client GST/state for future invoices
                              </button>
                            )}
                        </div>
                      )}
                      {tab === 'items' && (
                        <FinanceTable
                          columns={[
                            ['description', 'Description'],
                            ['quantity', 'Qty'],
                            [
                              'rateMinor',
                              'Rate',
                              (row) => money(row.rateMinor),
                            ],
                            [
                              'discountMinor',
                              'Discount',
                              (row) => money(row.discountMinor),
                            ],
                            ['taxRate', 'GST %'],
                            ['taxMinor', 'GST', (row) => money(row.taxMinor)],
                            [
                              'amountMinor',
                              'Line Total',
                              (row) => money(row.amountMinor),
                            ],
                          ]}
                          items={
                            invoice.lineItems ||
                            invoice.items.map((row) => ({
                              description: row.title,
                              quantity: 1,
                              rateMinor: Math.round(row.amount * 100),
                              amountMinor: Math.round(row.amount * 100),
                            }))
                          }
                        />
                      )}
                      {tab === 'payments' && (
                        <FinanceTable
                          columns={paymentColumns}
                          items={detail.data.payments}
                          actions={(row) =>
                            allowed('finance.payments.reverse') &&
                            row.status === 'POSTED' && (
                              <button onClick={() => show('reverse', row)}>
                                Reverse
                              </button>
                            )
                          }
                        />
                      )}
                      {tab === 'activity' && (
                        <ul className="space-y-3">
                          {detail.data.activity.map((row) => (
                            <li
                              key={row._id}
                              className="rounded-xl bg-[#f6faff] p-3 text-xs"
                            >
                              <strong>
                                {label(row.action.replace('finance.', ''))}
                              </strong>
                              <span className="ml-3 text-[#7184aa]">
                                {new Date(row.createdAt).toLocaleString(
                                  'en-IN',
                                  { timeZone: 'Asia/Kolkata' },
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {tab === 'documents' && (
                        <>
                          <button
                            className={`${button} mb-4`}
                            disabled={!allowed('finance.invoices.edit')}
                            onClick={() => show('document', invoice)}
                          >
                            Upload Document
                          </button>
                          <ul className="space-y-3">
                            {detail.data.documents.map((row) => (
                              <li
                                key={row._id}
                                className="flex justify-between rounded-xl border p-3 text-xs"
                              >
                                <span>{row.name}</span>
                                <button
                                  className="text-[#087dda]"
                                  onClick={() =>
                                    download.mutate({
                                      path: `/documents/${row._id}`,
                                      name: row.name,
                                    })
                                  }
                                >
                                  Download
                                </button>
                              </li>
                            ))}
                          </ul>
                          {!detail.data.documents.length && (
                            <p className="py-6 text-xs text-[#7184aa]">
                              No documents uploaded.
                            </p>
                          )}
                        </>
                      )}
                      {tab === 'followups' && (
                        <>
                          {allowed('finance.followups.manage') && (
                            <button
                              className={`${button} mb-4`}
                              onClick={() => show('followup', invoice)}
                            >
                              Log follow-up
                            </button>
                          )}
                          <FinanceTable
                            columns={[
                              ['type', 'Type'],
                              ['date', 'Date', (row) => day(row.date)],
                              ['notes', 'Notes'],
                              [
                                'nextFollowUpAt',
                                'Next Date',
                                (row) => day(row.nextFollowUpAt),
                              ],
                              ['status', 'Status'],
                            ]}
                            items={detail.data.followups}
                            actions={(row) =>
                              allowed('finance.followups.manage') && (
                                <button
                                  onClick={() => show('editFollowup', row)}
                                >
                                  Edit
                                </button>
                              )
                            }
                          />
                        </>
                      )}
                    </section>
                  </>
                )}
              </FinanceState>
            )}
            {!invoiceId &&
              !['dashboard', 'reports'].includes(section) &&
              (section === 'ledger' && !filters.client ? (
                <p
                  className={`${panel} py-12 text-center text-sm text-[#7184aa]`}
                >
                  Choose a client and apply filters to view the
                  transaction-derived ledger.
                </p>
              ) : (
                <FinanceState query={query}>
                  {data && (
                    <section className={panel}>
                      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-sm font-bold">
                          {label(section)}
                          {section === 'ledger' &&
                            ` · Opening ${money(data.openingMinor)} · Closing ${money(data.closingMinor)}`}
                        </h2>
                        <div className="flex gap-2">
                          {section === 'recurring' &&
                            allowed('finance.recurring.manage') && (
                              <button
                                className={button}
                                onClick={() => show('recurring')}
                              >
                                + Recurring Service
                              </button>
                            )}
                          <details className="text-xs">
                            <summary className={`${input} cursor-pointer`}>
                              Columns
                            </summary>
                            <div className="mt-3 flex flex-wrap gap-3">
                              {tableColumns.map(([key, title]) => (
                                <label key={key}>
                                  <input
                                    type="checkbox"
                                    checked={!hiddenColumns.includes(key)}
                                    onChange={(event) =>
                                      setHiddenColumns(
                                        event.target.checked
                                          ? hiddenColumns.filter(
                                              (value) => value !== key,
                                            )
                                          : [...hiddenColumns, key],
                                      )
                                    }
                                  />{' '}
                                  {title}
                                </label>
                              ))}
                            </div>
                          </details>
                          {allowed('finance.reports.export') &&
                            [
                              'invoices',
                              'payments',
                              'expenses',
                              'outstanding',
                              'ledger',
                            ].includes(section) && (
                              <>
                                <select
                                  aria-label="Finance export format"
                                  className={`${input} w-auto!`}
                                  value={format}
                                  onChange={(event) =>
                                    setFormat(event.target.value)
                                  }
                                >
                                  {['csv', 'xlsx', 'pdf'].map((value) => (
                                    <option key={value}>{value}</option>
                                  ))}
                                </select>
                                <button
                                  className={button}
                                  disabled={download.isPending}
                                  onClick={() =>
                                    download.mutate({
                                      path: `/reports/${exportKey}?${new URLSearchParams({ ...clean(filters), format })}`,
                                      name: `finance-${exportKey}.${format}`,
                                    })
                                  }
                                >
                                  <Download size={14} />
                                  Export
                                </button>
                              </>
                            )}
                        </div>
                      </div>
                      {section === 'profitability' && (
                        <p className="mb-4 rounded-xl bg-[#fff8eb] p-3 text-xs leading-5 text-[#8f6c31]">
                          {data.basis}
                        </p>
                      )}
                      <FinanceTable
                        columns={tableColumns.filter(
                          ([key]) => !hiddenColumns.includes(key),
                        )}
                        items={data.items || []}
                        actions={
                          section === 'profitability' || section === 'ledger'
                            ? undefined
                            : actions
                        }
                        pagination={data.pagination}
                        onPage={setPage}
                        onSort={['invoices','outstanding'].includes(section) ? (key) => { const field = key==='invoiceDate'?'date':key; setFilters({...filters,sort:field,order:filters.sort===field&&filters.order==='asc'?'desc':'asc'});setPage(1); } : undefined}
                      />
                    </section>
                  )}
                </FinanceState>
              ))}
            {section === 'reports' && (
              <section className={panel}>
                <h2 className="text-lg font-bold">Finance Reports & GST</h2>
                <p className="mt-2 text-xs text-[#7184aa]">
                  Exports are rebuilt from current authorized source data.
                  Amount columns are INR paise. Choose a client for ledger
                  exports.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <select
                    aria-label="Finance report"
                    className={`${input} max-w-xs`}
                    value={report}
                    onChange={(event) => setReport(event.target.value)}
                  >
                    {[
                      'invoices',
                      'payments',
                      'outstanding',
                      'expenses',
                      'ledger',
                      'gst',
                    ].map((key) => (
                      <option key={key} value={key}>
                        {key === 'gst' ? 'Tax / GST Summary' : label(key)}
                      </option>
                    ))}
                  </select>
                  <select
                    className={`${input} w-auto!`}
                    value={format}
                    onChange={(event) => setFormat(event.target.value)}
                  >
                    {['csv', 'xlsx', 'pdf'].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                  <button
                    className={button}
                    disabled={
                      !allowed('finance.reports.export') || download.isPending
                    }
                    onClick={() =>
                      download.mutate({
                        path: `/reports/${report}?${new URLSearchParams({ ...clean(filters), format })}`,
                        name: `finance-${report}.${format}`,
                      })
                    }
                  >
                    <Download size={14} />
                    Generate Export
                  </button>
                  <Link className={button} to="/reports/finance">
                    Open Reports Management <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    ['Billed Revenue', 'Invoice issue dates; includes GST.'],
                    ['Collections', 'Receipt dates minus payment reversals.'],
                    [
                      'Profitability',
                      'Direct recorded cost contribution; incomplete allocations are clearly marked.',
                    ],
                  ].map(([title, text]) => (
                    <div className="rounded-xl border p-4" key={title}>
                      <h3 className="text-sm font-bold">{title}</h3>
                      <p className="mt-2 text-xs leading-5 text-[#7184aa]">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </FinanceState>
      {dialog?.mode === 'access' && (
        <FinanceAccess onClose={() => setDialog(null)} />
      )}{' '}
      {dialog?.mode === 'expenseDetails' && <ExpenseDetail row={dialog.row} onClose={() => setDialog(null)} download={(request) => download.mutate(request)} />}
      {dialog && !['access', 'expenseDetails'].includes(dialog.mode) && (
        <FinanceForm
          key={`${dialog.mode}:${dialog.row?._id || 'new'}`}
          mode={dialog.mode}
          row={dialog.row}
          metadata={metadata.data}
          onClose={close}
        />
      )}
    </main>
  );
}
