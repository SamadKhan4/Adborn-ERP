import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import HRMSDialog from '../hrms/HRMSDialog.jsx';
import { api } from '../../services/api.js';
import { useDebounced } from '../crm/CRMShared.jsx';
import {
  financeInput as input,
  financeButton as button,
  amountInput,
  day,
  today,
  label,
} from './FinanceShared.jsx';
const id = (value) => (typeof value === 'object' ? value?._id : value);
const clean = (fields) =>
  Object.fromEntries(
    Object.entries(fields).filter(
      ([, value]) => value !== '' && value !== undefined,
    ),
  );
const names = {
  invoice: 'Create Invoice',
  editInvoice: 'Edit Draft Invoice',
  payment: 'Record Payment',
  expense: 'Add Expense',
  editExpense: 'Edit Expense',
  recurring: 'Recurring Billing',
  editRecurring: 'Edit Recurring Service',
  followup: 'Log Payment Follow-up',
  editFollowup: 'Edit Payment Follow-up',
  settings: 'Company & Finance Settings',
  tax: 'Client GST / State',
  reverse: 'Reverse Payment',
  cancel: 'Cancel Invoice',
  document: 'Upload Financial Document',
};
export default function FinanceForm({ mode, row, metadata, onClose }) {
  const issuers = useQuery({
    queryKey: ['invoice-issuers'],
    queryFn: async () => (await api.get('/invoices/issuers')).data.data,
    staleTime: Infinity,
    enabled: ['invoice', 'editInvoice'].includes(mode),
  });
  const invoiceMode = ['invoice', 'editInvoice'].includes(mode),
    expenseMode = ['expense', 'editExpense'].includes(mode),
    recurringMode = ['recurring', 'editRecurring'].includes(mode),
    followMode = ['followup', 'editFollowup'].includes(mode);
  const [key] = useState(() => crypto.randomUUID());
  const [taxClient, setTaxClient] = useState(null);
  const [file, setFile] = useState(null),
    [form, setForm] = useState(() => {
      if (invoiceMode)
        return {
          invoiceType:
            row?.invoiceType || (row?.taxMinor > 0 ? 'GST' : 'NON_GST'),
          client: id(row?.clientRef) || '',
          quotation: id(row?.quotation) || '',
          project: id(row?.project) || '',
          service: row?.service || '',
          invoiceDate: mode === 'invoice' ? today() : day(row?.invoiceDate),
          dueDate: mode === 'invoice' ? today() : day(row?.dueDate),
          status: 'DRAFT',
          otherCharges: amountInput(row?.otherChargesMinor || 0),
          notes: row?.notes || '',
          reference: row?.reference || '',
          paymentTerms: row?.paymentTerms || '',
          ...(mode === 'editInvoice' ? { revision: row.revision || 0 } : {}),
        };
      if (mode === 'payment')
        return {
          invoice: row?._id || '',
          amount: amountInput(row?.balanceMinor),
          paymentDate: today(),
          method: 'BANK_TRANSFER',
          transactionReference: '',
          notes: '',
        };
      if (expenseMode)
        return {
          date: day(row?.date) || today(),
          category: row?.category || 'Miscellaneous',
          vendor: row?.vendor || '',
          description: row?.description || '',
          amount: amountInput(row?.amountMinor),
          tax: amountInput(row?.taxMinor || 0),
          method: row?.method || 'BANK_TRANSFER',
          client: id(row?.client) || '',
          project: id(row?.project) || '',
          department: row?.department || '',
          employee: id(row?.employee) || '',
          service: row?.service || '',
          status: 'DRAFT',
          ...(row ? { revision: row.revision } : {}),
        };
      if (recurringMode)
        return {
          client: id(row?.client) || '',
          project: id(row?.project) || '',
          service: row?.service || '',
          description: row?.description || '',
          startDate: day(row?.startDate) || today(),
          endDate: day(row?.endDate),
          nextBillingDate: day(row?.nextBillingDate) || today(),
          frequency: row?.frequency || 'MONTHLY',
          amount: amountInput(row?.amountMinor),
          taxRate: row?.taxRate || '0',
          accountManager: id(row?.accountManager) || '',
          autoInvoice: row?.autoInvoice || false,
          status: row?.status || 'ACTIVE',
          ...(row ? { revision: row.revision } : {}),
        };
      if (followMode)
        return {
          invoice: id(row?.invoice) || row?._id || '',
          type: row?.type || 'CALL',
          date: day(row?.date) || today(),
          notes: row?.notes || '',
          outcome: row?.outcome || '',
          promisedPaymentDate: day(row?.promisedPaymentDate),
          nextFollowUpAt: day(row?.nextFollowUpAt),
          assignedTo: id(row?.assignedTo) || '',
          status: row?.type ? row.status : 'PENDING',
        };
      if (mode === 'settings')
        return {
          companyName: '',
          address: '',
          gstin: '',
          stateCode: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          branch: '',
          upi: '',
          terms: '',
          requireExpenseApproval: true,
          ...clean(
            Object.fromEntries(
              Object.entries(row || {}).filter(([field]) =>
                [
                  'companyName',
                  'address',
                  'gstin',
                  'stateCode',
                  'bankName',
                  'accountNumber',
                  'ifscCode',
                  'branch',
                  'upi',
                  'terms',
                  'requireExpenseApproval',
                ].includes(field),
              ),
            ),
          ),
        };
      if (mode === 'tax')
        return { gstin: row?.gstin || '', stateCode: row?.stateCode || '' };
      return { reason: '' };
    });
  const [lines, setLines] = useState(
    () =>
      (
        row?.lineItems ||
        row?.items?.map((item) => ({
          description: item.title,
          quantity: '1',
          rateMinor: Math.round(item.amount * 100),
          discountMinor: 0,
          taxRate: String(row.gstRate || 0),
        }))
      )?.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        rate: amountInput(line.rateMinor),
        discount: amountInput(line.discountMinor),
        taxRate: line.taxRate,
      })) || [
        {
          description: '',
          quantity: '1',
          rate: '',
          discount: '0',
          taxRate: '0',
        },
      ],
  );
  const refs = useQuery({
    queryKey: ['financeMetadata', 'form', form.client],
    queryFn: async ({ signal }) =>
      (
        await api.get('/finance/metadata', {
          signal,
          params: clean({ client: form.client }),
        })
      ).data.data,
    enabled:
      Boolean(form.client) && (invoiceMode || expenseMode || recurringMode),
  });
  const [clientSearch, setClientSearch] = useState('');
  const debouncedSearch = useDebounced(clientSearch);
  const search = useQuery({
    queryKey: ['financeClientSearch', debouncedSearch],
    enabled: debouncedSearch.length >= 2,
    queryFn: async ({ signal }) =>
      (
        await api.get('/finance/metadata', {
          signal,
          params: { search: debouncedSearch },
        })
      ).data.data,
  });
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      let body = clean(form),
        path,
        method = 'post';
      if (invoiceMode) {
        body.items = lines.map((line) => ({
          ...line,
          taxRate: form.invoiceType === 'NON_GST' ? '0' : line.taxRate,
        }));
        path = mode === 'editInvoice' ? `/invoices/${row._id}` : '/invoices';
        if (mode === 'editInvoice') method = 'patch';
      } else if (mode === 'payment') path = '/payments';
      else if (expenseMode) {
        path = mode === 'editExpense' ? `/expenses/${row._id}` : '/expenses';
        if (mode === 'editExpense') method = 'patch';
      } else if (recurringMode) {
        path =
          mode === 'editRecurring' ? `/recurring/${row._id}` : '/recurring';
        if (mode === 'editRecurring') method = 'patch';
        if (form.frequency === 'CUSTOM')
          body.customDays = Number(form.customDays);
      } else if (followMode) {
        path = mode === 'editFollowup' ? `/followups/${row._id}` : '/followups';
        if (mode === 'editFollowup') method = 'patch';
      } else if (mode === 'settings') {
        path = '/settings';
        method = 'patch';
        body = form;
      } else if (mode === 'tax') {
        path = `/clients/${row._id}/tax`;
        method = 'patch';
        body = form;
      } else if (mode === 'cancel') path = `/invoices/${row._id}/cancel`;
      else if (mode === 'reverse') path = `/payments/${row._id}/reverse`;
      else if (mode === 'document') {
        const data = new FormData();
        data.append('file', file);
        return api.post(
          `/finance/${row.kind === 'expense' ? 'expenses' : 'invoices'}/${row._id}/documents`,
          data,
        );
      }
      return api[method](`/finance${path}`, body, {
        headers: { 'Idempotency-Key': key },
      });
    },
    onSuccess: () => {
      [
        'finance',
        'financeMetadata',
        'financeInvoice',
        'reports',
        'reportDetail',
        'admin-overview',
        'invoices',
        'crmDashboard',
      ].forEach((queryKey) =>
        client.invalidateQueries({ queryKey: [queryKey] }),
      );
      onClose('Saved successfully.');
    },
  });
  function field(name, title, type = 'text', required = false, options) {
    return (
      <label className="block text-[11px] text-[#587393]" key={name}>
        {title}
        {required ? ' *' : ''}
        {options ? (
          <select
            className={`${input} mt-2`}
            value={form[name] || ''}
            required={required}
            onChange={(event) =>
              setForm({ ...form, [name]: event.target.value })
            }
          >
            <option value="">Select</option>
            {options.map((option) => (
              <option
                key={option.value ?? option}
                value={option.value ?? option}
              >
                {option.label ?? label(option)}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            className={`${input} mt-2`}
            required={required}
            rows={3}
            maxLength={name === 'notes' ? 1500 : 2000}
            value={form[name] || ''}
            onChange={(event) =>
              setForm({ ...form, [name]: event.target.value })
            }
          />
        ) : (
          <input
            className={`${input} mt-2`}
            type={type}
            required={required}
            step={type === 'number' ? '0.01' : undefined}
            min={type === 'number' ? '0' : undefined}
            maxLength={type === 'text' ? 300 : undefined}
            value={form[name] ?? ''}
            onChange={(event) =>
              setForm({ ...form, [name]: event.target.value })
            }
          />
        )}
      </label>
    );
  }
  const clients = (search.data || metadata)?.clients || [],
    projects = refs.data?.projects || metadata?.projects || [],
    quotations = refs.data?.quotations || metadata?.quotations || [];
  const clientOptions = clients.map((row) => ({
    value: row._id,
    label: row.companyName,
  }));
  if (
    form.client &&
    !clientOptions.some((option) => option.value === form.client)
  )
    clientOptions.push({ value: form.client, label: 'Current linked client' });
  return (
    <HRMSDialog
      open
      wide={invoiceMode}
      onOpenChange={() => onClose()}
      title={names[mode]}
      description={
        mode === 'settings'
          ? 'Company, GST and bank information used on new invoices. Existing issued invoice snapshots are preserved.'
          : 'All amounts are INR. Totals, GST, permissions and status transitions are validated on the server.'
      }
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (!mutation.isPending) mutation.mutate();
        }}
      >
        <div
          className={
            invoiceMode
              ? 'rounded-2xl border border-[#dce7f0] bg-[#f2f8ff] p-4'
              : 'hidden'
          }
        >
          {invoiceMode && (
            <label className="text-xs">
              Invoice type
              <select
                aria-label="Invoice type"
                className={input}
                value={form.invoiceType}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((f) => ({ ...f, invoiceType: value }));
                  setLines((rows) =>
                    rows.map((row) => ({
                      ...row,
                      taxRate: value === 'GST' ? '18' : '0',
                    })),
                  );
                }}
              >
                <option value="GST">With GST - ABCO Computers</option>
                <option value="NON_GST">Without GST - AdBorn Solutions</option>
              </select>
            </label>
          )}
          {invoiceMode && form.invoiceType === 'GST' && (
            <label className="block text-xs mt-3">
              Company GSTIN (automatic)
              <input
                readOnly
                className={input}
                value={issuers.data?.GST?.gstin || ''}
                placeholder="Loading company GSTIN..."
              />
            </label>
          )}
        </div>
        {(invoiceMode || expenseMode || recurringMode) && (
          <label className="block text-xs">
            Find client
            <input
              className={`${input} mt-2`}
              placeholder="Search company (2+ characters)"
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
            />
          </label>
        )}
        {(invoiceMode || recurringMode) && form.client && (
          <button
            type="button"
            className="text-xs font-semibold text-[#087dda]"
            onClick={() =>
              setTaxClient(
                clients.find((client) => client._id === form.client) || {
                  _id: form.client,
                },
              )
            }
          >
            Update selected client GST / state
          </button>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {(invoiceMode || expenseMode || recurringMode) && (
            <>
              {field(
                'client',
                'Client',
                'text',
                invoiceMode || recurringMode,
                clientOptions,
              )}
              {field(
                'project',
                'Project',
                'text',
                false,
                projects.map((row) => ({ value: row._id, label: row.title })),
              )}
              {field(
                'service',
                'Service',
                'text',
                recurringMode,
                (metadata?.services || []).map((row) => ({
                  value: row.id,
                  label: row.name || row.label || label(row.id),
                })),
              )}
            </>
          )}
          {invoiceMode && (
            <>
              {field(
                'quotation',
                'Accepted quotation',
                'text',
                false,
                quotations.map((row) => ({
                  value: row._id,
                  label: row.quotationNumber,
                })),
              )}
              {field('invoiceDate', 'Invoice date', 'date', true)}
              {field('dueDate', 'Due date', 'date', true)}
              {field('status', 'Save as', 'text', true, ['DRAFT', 'SENT'])}
              {field('otherCharges', 'Other charges', 'number')}
              {field('reference', 'Reference')}
              {field('paymentTerms', 'Payment terms')}
              {field('notes', 'Notes', 'textarea')}
            </>
          )}
          {mode === 'payment' && (
            <>
              {field('invoice', 'Invoice', 'text', true, [
                ...(metadata?.invoices || []).map((item) => ({
                  value: item._id,
                  label:
                    item.invoiceNumber + ' - ' + (item.client?.company || ''),
                })),
                ...(form.invoice &&
                !(metadata?.invoices || []).some(
                  (item) => item._id === form.invoice,
                )
                  ? [
                      {
                        value: form.invoice,
                        label: row?.invoiceNumber || 'Linked invoice',
                      },
                    ]
                  : []),
              ])}
              {field('paymentDate', 'Payment date', 'date', true)}
              {field('amount', 'Amount received', 'number', true)}
              {field(
                'method',
                'Payment method',
                'text',
                true,
                metadata?.methods || [],
              )}
              {field('transactionReference', 'Transaction reference')}
              {field('notes', 'Notes', 'textarea')}
            </>
          )}
          {expenseMode && (
            <>
              {field('date', 'Expense date', 'date', true)}
              {field(
                'category',
                'Category',
                'text',
                true,
                metadata?.expenseCategories || [],
              )}
              {field('vendor', 'Vendor', 'text', true)}
              {field('description', 'Description', 'textarea', true)}
              {field('amount', 'Base amount', 'number', true)}
              {field('tax', 'Tax amount', 'number')}
              {field(
                'method',
                'Payment method',
                'text',
                true,
                metadata?.methods || [],
              )}
              {field(
                'department',
                'Department',
                'text',
                false,
                (metadata?.departments || []).map((row) => ({
                  value: row.key,
                  label: row.name,
                })),
              )}
              {field(
                'employee',
                'Employee allocation',
                'text',
                false,
                (metadata?.users || []).map((row) => ({
                  value: row._id,
                  label: row.name,
                })),
              )}
              {field('status', 'Save as', 'text', true, [
                'DRAFT',
                'PENDING_APPROVAL',
              ])}
            </>
          )}
          {recurringMode && (
            <>
              {field('description', 'Service description', 'text', true)}
              {field('startDate', 'Start date', 'date', true)}
              {field('endDate', 'End date', 'date')}
              {field('nextBillingDate', 'Next billing date', 'date', true)}
              {field('frequency', 'Billing frequency', 'text', true, [
                'MONTHLY',
                'QUARTERLY',
                'HALF_YEARLY',
                'YEARLY',
                'CUSTOM',
              ])}
              {form.frequency === 'CUSTOM' &&
                field('customDays', 'Interval days', 'number', true)}
              {field('amount', 'Amount before GST', 'number', true)}
              {field('taxRate', 'GST rate %', 'number', true)}
              {field('status', 'Contract status', 'text', true, [
                'ACTIVE',
                'PAUSED',
                'EXPIRED',
                'CANCELLED',
              ])}
              {field(
                'accountManager',
                'Account manager',
                'text',
                false,
                (metadata?.users || []).map((row) => ({
                  value: row._id,
                  label: row.name,
                })),
              )}
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.autoInvoice}
                  onChange={(event) =>
                    setForm({ ...form, autoInvoice: event.target.checked })
                  }
                />
                Generate draft invoices automatically when due
              </label>
            </>
          )}
          {followMode && (
            <>
              {field('invoice', 'Invoice', 'text', true, [
                ...(metadata?.invoices || []).map((item) => ({
                  value: item._id,
                  label:
                    item.invoiceNumber + ' - ' + (item.client?.company || ''),
                })),
                ...(form.invoice &&
                !(metadata?.invoices || []).some(
                  (item) => item._id === form.invoice,
                )
                  ? [
                      {
                        value: form.invoice,
                        label: row?.invoiceNumber || 'Linked invoice',
                      },
                    ]
                  : []),
              ])}
              {field('type', 'Follow-up type', 'text', true, [
                'CALL',
                'WHATSAPP',
                'EMAIL',
                'MEETING',
                'PROMISE_TO_PAY',
                'NOTE',
              ])}
              {field('date', 'Date', 'date', true)}
              {field('notes', 'Notes', 'textarea', true)}
              {field('outcome', 'Outcome')}
              {field('nextFollowUpAt', 'Next follow-up', 'date')}
              {field('promisedPaymentDate', 'Promised payment date', 'date')}
              {field(
                'assignedTo',
                'Assigned to',
                'text',
                false,
                (metadata?.users || []).map((row) => ({
                  value: row._id,
                  label: row.name,
                })),
              )}
              {field('status', 'Status', 'text', true, [
                'PENDING',
                'COMPLETED',
                'RESCHEDULED',
                'MISSED',
              ])}
            </>
          )}
          {mode === 'settings' && (
            <>
              {[
                'companyName',
                'address',
                'gstin',
                'stateCode',
                'bankName',
                'accountNumber',
                'ifscCode',
                'branch',
                'upi',
                'terms',
              ].map((name) =>
                field(
                  name,
                  label(name),
                  name === 'terms' || name === 'address' ? 'textarea' : 'text',
                  !['gstin', 'branch', 'upi', 'terms'].includes(name),
                ),
              )}
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.requireExpenseApproval}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      requireExpenseApproval: event.target.checked,
                    })
                  }
                />
                Require expense approval
              </label>
            </>
          )}
          {mode === 'tax' && (
            <>
              {field('gstin', 'Client GSTIN')}
              {field('stateCode', 'Client state code (2 digits)', 'text', true)}
            </>
          )}
          {['cancel', 'reverse'].includes(mode) &&
            field('reason', 'Reason', 'textarea', true)}
          {mode === 'document' && (
            <label className="text-xs">
              PDF, PNG or JPEG (up to 10 MB)
              <input
                aria-label="Financial document"
                className={`${input} mt-2`}
                required
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(event) => setFile(event.target.files?.[0])}
              />
            </label>
          )}
        </div>
        {invoiceMode && (
          <div className="overflow-x-auto">
            <h3 className="mb-3 text-sm font-bold">Invoice items</h3>
            <table className="min-w-[720px] w-full text-xs">
              <thead>
                <tr>
                  {[
                    'Description',
                    'Quantity',
                    'Rate',
                    'Discount amount',
                    'GST %',
                    '',
                  ].map((title) => (
                    <th className="p-2 text-left" key={title}>
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index}>
                    {[
                      'description',
                      'quantity',
                      'rate',
                      'discount',
                      'taxRate',
                    ].map((field) => (
                      <td className="p-1" key={field}>
                        <input
                          aria-label={`${label(field)} ${index + 1}`}
                          required
                          className={`${input} ${field === 'description' ? 'min-w-52' : 'w-24'}`}
                          disabled={
                            field === 'taxRate' &&
                            form.invoiceType === 'NON_GST'
                          }
                          value={line[field]}
                          type={field === 'description' ? 'text' : 'number'}
                          min="0"
                          step={field === 'quantity' ? '0.0001' : '0.01'}
                          maxLength={field === 'description' ? 300 : undefined}
                          onChange={(event) =>
                            setLines(
                              lines.map((item, itemIndex) =>
                                index === itemIndex
                                  ? { ...item, [field]: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        disabled={lines.length <= 1}
                        className="px-2 text-red-500 disabled:opacity-30"
                        onClick={() =>
                          setLines(
                            lines.filter((_, itemIndex) => index !== itemIndex),
                          )
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="mt-3 text-xs font-semibold text-[#087dda]"
              disabled={lines.length >= 6}
              onClick={() =>
                setLines([
                  ...lines,
                  {
                    description: '',
                    quantity: '1',
                    rate: '',
                    discount: '0',
                    taxRate: '0',
                  },
                ])
              }
            >
              + Add item
            </button>
            <p className="mt-3 text-xs text-[#71859a]">
              GST is derived from company and client states. Final rounded
              amounts appear after saving.
            </p>
          </div>
        )}
        {(mutation.isError || refs.isError || search.isError) && (
          <p role="alert" className="text-sm text-red-600">
            {mutation.error?.response?.data?.error?.message ||
              refs.error?.response?.data?.error?.message ||
              search.error?.response?.data?.error?.message ||
              'Unable to save. Check fields and retry.'}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t pt-4">
          <button className="text-xs" type="button" onClick={() => onClose()}>
            Cancel
          </button>
          <button className={button} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
      {taxClient && (
        <FinanceForm
          mode="tax"
          row={taxClient}
          metadata={metadata}
          onClose={() => setTaxClient(null)}
        />
      )}
    </HRMSDialog>
  );
}
