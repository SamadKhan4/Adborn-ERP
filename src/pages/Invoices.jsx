import { useSearchParams } from 'react-router-dom';
import { invoiceIsOverdue } from '../lib/invoiceFilters.js';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Eye,
  FilePenLine,
  FileText,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../services/api.js';
import HRMSDialog from '../components/hrms/HRMSDialog.jsx';
import { Button } from '../components/ui/Button.jsx';

const statuses = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];
const emptyClient = {
  company: '',
  contactPerson: '',
  address: '',
  contactNumber: '',
  email: '',
};
const emptyPayment = {
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  branch: '',
};
const inputClass =
  'mt-1.5 min-h-10 w-full rounded-xl border border-[#dce7f0] bg-white px-3 text-xs text-[#173958] outline-none focus:border-[#0987C4] focus:ring-4 focus:ring-[#0987c414]';
const money = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const dateValue = (value = new Date()) =>
  new Date(value).toISOString().slice(0, 10);
const initialForm = () => {
  const invoiceDate = dateValue();
  const due = new Date();
  due.setDate(due.getDate() + 15);
  return {
    invoiceDate,
    dueDate: dateValue(due),
    client: { ...emptyClient },
    paymentDetails: { ...emptyPayment },
    items: [{ title: '', amount: '' }],
    invoiceType: 'GST',
    gstin: '',
    gstRate: 18,
    status: 'Draft',
    notes: '',
  };
};
const fromInvoice = (invoice) => ({
  ...invoice,
  invoiceType:
    invoice.invoiceType || (invoice.gstAmount > 0 ? 'GST' : 'NON_GST'),
  client: { ...invoice.client },
  paymentDetails: { ...invoice.paymentDetails },
  items: invoice.items.map(({ title, amount }) => ({ title, amount })),
  invoiceDate: invoice.invoiceDate.slice(0, 10),
  dueDate: invoice.dueDate.slice(0, 10),
});

function Field({ label, children }) {
  return (
    <label className="block text-[10px] font-semibold text-[#31516f]">
      {label}
      {children}
    </label>
  );
}

export function InvoiceForm({ invoice, business, onClose }) {
  const queryClient = useQueryClient();
  const issuers = useQuery({
    queryKey: ['invoice-issuers'],
    queryFn: async () => (await api.get('/invoices/issuers')).data.data,
    staleTime: Infinity,
  });
  const [form, setForm] = useState(() =>
    invoice
      ? fromInvoice(invoice)
      : business
        ? {
            ...initialForm(),
            gstRate: business.quotation?.gstRate ?? 18,
            client: {
              company: business.client.companyName,
              contactPerson: business.client.contactPerson,
              contactNumber: business.client.phone,
              email: business.client.email,
              address: Object.values(business.client.address || {}).join(', '),
            },
            items: [
              {
                title:
                  business.project?.title ||
                  business.quotation?.title ||
                  'Service',
                amount:
                  business.project?.amount ?? business.quotation?.subtotal ?? 0,
              },
            ],
          }
        : initialForm(),
  );
  const mutation = useMutation({
    mutationFn: async (payload) =>
      invoice
        ? (await api.put(`/invoices/${invoice._id}`, payload)).data
        : (await api.post('/invoices', payload)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    },
  });
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setNested = (group, key, value) =>
    setForm((current) => ({
      ...current,
      [group]: { ...current[group], [key]: value },
    }));
  const updateItem = (index, key, value) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  const subtotal = form.items.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const gst = (subtotal * Number(form.gstRate || 0)) / 100;
  const submit = (event) => {
    event.preventDefault();
    mutation.mutate({
      ...(business?.project ? { project: business.project._id } : {}),
      ...(business?.quotation ? { quotation: business.quotation._id } : {}),
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      client: form.client,
      paymentDetails: form.paymentDetails,
      items: form.items
        .map((item) => ({
          title: item.title.trim(),
          amount: Number(item.amount || 0),
        }))
        .filter((item) => item.title),
      invoiceType: form.invoiceType,
      gstin: form.gstin || '',
      gstRate: form.invoiceType === 'NON_GST' ? 0 : Number(form.gstRate),
      status: form.status,
      ...(form.notes ? { notes: form.notes } : {}),
    });
  };
  const responseError = mutation.error?.response?.data?.error;
  const error = responseError?.details?.length
    ? responseError.details
        .map(({ field, message }) => `${field ? `${field}: ` : ''}${message}`)
        .join('; ')
    : responseError?.message || mutation.error?.message;
  return (
    <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-[#dce7f0] bg-[#f2f8ff] p-4">
          <Field label="Invoice type">
            <select
              aria-label="Invoice type"
              className={inputClass}
              value={form.invoiceType}
              onChange={(e) => {
                set('invoiceType', e.target.value);
                set('gstRate', e.target.value === 'GST' ? 18 : 0);
              }}
            >
              <option value="GST">With GST - ABCO Computers</option>
              <option value="NON_GST">Without GST - AdBorn Solutions</option>
            </select>
          </Field>
          {form.invoiceType === 'GST' && (
            <Field label="Company GSTIN (automatic)">
              <input
                readOnly
                className={inputClass}
                value={issuers.data?.GST?.gstin || ''}
                placeholder="Loading company GSTIN..."
              />
            </Field>
          )}
        </section>
        <section className="grid gap-4 rounded-2xl bg-[#f7fafd] p-4 sm:grid-cols-3">
          <Field label="Invoice date">
            <input
              required
              type="date"
              className={inputClass}
              value={form.invoiceDate}
              onChange={(event) => set('invoiceDate', event.target.value)}
            />
          </Field>
          <Field label="Due date">
            <input
              required
              type="date"
              min={form.invoiceDate}
              className={inputClass}
              value={form.dueDate}
              onChange={(event) => set('dueDate', event.target.value)}
            />
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(event) => set('status', event.target.value)}
            >
              {form.status === 'Paid' && <option disabled>Paid</option>}
              {statuses
                .filter((status) => status !== 'Paid')
                .map((status) => (
                  <option key={status}>{status}</option>
                ))}
            </select>
            <span className="mt-1 block">
              Record payments in Finance to mark an invoice as paid.
            </span>
          </Field>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#e5edf5] p-4">
            <h3 className="mb-3 text-xs font-bold text-[#087fc3]">Bill to</h3>
            <div className="space-y-3">
              {[
                ['company', 'Client / Company', 'text'],
                ['contactPerson', 'Contact Person', 'text'],
                ['address', 'Address', 'text'],
                ['contactNumber', 'Contact No.', 'tel'],
                ['email', 'Email (optional)', 'email'],
              ].map(([key, label, type]) => (
                <Field key={key} label={label}>
                  <input
                    required={key !== 'email'}
                    type={type}
                    className={inputClass}
                    value={form.client[key]}
                    onChange={(event) =>
                      setNested('client', key, event.target.value)
                    }
                  />
                </Field>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e5edf5] p-4">
            <h3 className="mb-3 text-xs font-bold text-[#087fc3]">
              Payment details
            </h3>
            <div className="space-y-3">
              {[
                ['bankName', 'Bank Name'],
                ['accountNumber', 'Account Number'],
                ['ifscCode', 'IFSC Code'],
                ['branch', 'Branch'],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    required
                    className={inputClass}
                    value={form.paymentDetails[key]}
                    onChange={(event) =>
                      setNested('paymentDetails', key, event.target.value)
                    }
                  />
                </Field>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Service details</h3>
              <p className="text-[9px] text-[#75889c]">
                Enter only the service title and price manually (maximum 6).
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={form.items.length >= 6}
              onClick={() =>
                set('items', [...form.items, { title: '', amount: '' }])
              }
            >
              <Plus size={14} />
              Add service
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#dfe8f1]">
            <div className="grid grid-cols-[42px_1fr_130px_40px] bg-[#082f55] px-2 py-3 text-[9px] font-bold text-white">
              <span>NO.</span>
              <span>SERVICE TITLE</span>
              <span>AMOUNT</span>
              <span />
            </div>
            {form.items.map((item, index) => (
              <div
                key={index}
                className={`grid grid-cols-[42px_1fr_130px_40px] items-center gap-2 px-2 py-2 ${index % 2 ? 'bg-[#f3f8fb]' : 'bg-white'}`}
              >
                <span className="text-xs font-semibold text-[#1593d0]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <input
                  required
                  aria-label={`Service title ${index + 1}`}
                  placeholder="Enter service title"
                  className="min-h-9 rounded-lg border border-[#dce7f0] px-2 text-xs"
                  value={item.title}
                  onChange={(event) =>
                    updateItem(index, 'title', event.target.value)
                  }
                />
                <input
                  required
                  aria-label={`Amount ${index + 1}`}
                  type="number"
                  min="0"
                  step="0.01"
                  className="min-h-9 rounded-lg border border-[#dce7f0] px-2 text-xs"
                  value={item.amount}
                  onChange={(event) =>
                    updateItem(index, 'amount', event.target.value)
                  }
                />
                <button
                  type="button"
                  aria-label={`Remove service ${index + 1}`}
                  disabled={form.items.length === 1}
                  onClick={() =>
                    set(
                      'items',
                      form.items.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#bd4a55] hover:bg-[#fff0f1] disabled:opacity-35"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {form.invoiceType === 'GST' && (
            <Field label="Client GSTIN (optional)">
              <input
                aria-label="Client GSTIN"
                className={inputClass}
                maxLength={15}
                value={form.gstin || ''}
                onChange={(e) => set('gstin', e.target.value.toUpperCase())}
              />
            </Field>
          )}
          <Field label="GST rate (%)">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              className={inputClass}
              disabled={form.invoiceType === 'NON_GST'}
              value={form.gstRate}
              onChange={(event) => set('gstRate', event.target.value)}
            />
          </Field>
          <Field label="Internal notes">
            <textarea
              className={`${inputClass} min-h-20 py-3`}
              value={form.notes}
              onChange={(event) => set('notes', event.target.value)}
            />
          </Field>
        </section>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]"
          >
            {error}
          </p>
        )}
      </div>

      <aside
        style={{
          '--invoice-accent':
            form.invoiceType === 'GST' ? '#a00000' : '#1593d0',
          '--invoice-dark': form.invoiceType === 'GST' ? '#2c1d1d' : '#082f55',
          '--invoice-pale': form.invoiceType === 'GST' ? '#fff8f8' : '#f2f7fa',
        }}
        className="h-fit rounded-[20px] border border-[#dfe8f1] bg-[#fbfdff] p-4 xl:sticky xl:top-4"
      >
        <div
          className={`border-t-[5px] ${form.invoiceType === 'GST' ? 'border-[#2c1d1d]' : 'border-[#082f55]'} bg-white p-4 shadow-[0_12px_35px_#315d8612]`}
        >
          <img
            src={
              form.invoiceType === 'GST' ? '/ABCO_Logo.png' : '/adborn_logo.png'
            }
            alt={
              form.invoiceType === 'GST' ? 'ABCO Computers' : 'AdBorn Solutions'
            }
            className="h-10 w-auto"
          />
          <div className="my-4 h-px bg-[#dce3e8]" />
          <div className="flex justify-between">
            <div>
              <h3 className="text-xl font-extrabold">INVOICE</h3>
              <p className="mt-2 max-w-44 text-[7px] text-[#657487]">
                Thank you for choosing{' '}
                {form.invoiceType === 'GST'
                  ? 'ABCO Computers'
                  : 'AdBorn Solutions'}
                .
              </p>
            </div>
            <div className="rounded-xl bg-[var(--invoice-pale)] p-2 text-[7px]">
              <p>DATE: {form.invoiceDate}</p>
              <p className="mt-1">DUE: {form.dueDate}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[var(--invoice-pale)] p-2">
              <b className="text-[8px] text-[var(--invoice-accent)]">BILL TO</b>
              <p className="mt-2 text-[8px]">
                {form.client.company || 'Client / Company'}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--invoice-pale)] p-2">
              <b className="text-[8px] text-[var(--invoice-accent)]">
                PAYMENT DETAILS
              </b>
              <p className="mt-2 text-[8px]">
                {form.paymentDetails.bankName || 'Bank Name'}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            {form.items.map((item, index) => (
              <div
                key={index}
                className={`grid grid-cols-[22px_1fr_66px] gap-2 px-2 py-2 text-[8px] ${index % 2 ? 'bg-[var(--invoice-pale)]' : ''}`}
              >
                <span className="text-[var(--invoice-accent)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="truncate">
                  {item.title || 'Service title'}
                </span>
                <b className="text-right">{money(item.amount)}</b>
              </div>
            ))}
          </div>
          <div className="ml-auto mt-4 w-48">
            <div className="space-y-2 bg-[var(--invoice-pale)] p-3 text-[9px]">
              <p className="flex justify-between">
                <span>SUBTOTAL</span>
                <b>{money(subtotal)}</b>
              </p>
              {form.invoiceType === 'GST' && (
                <p className="flex justify-between">
                  <span>GST {form.gstRate}%</span>
                  <b>{money(gst)}</b>
                </p>
              )}
            </div>
            <div className="flex justify-between bg-[var(--invoice-dark)] p-3 text-[10px] text-white">
              <span>GRAND TOTAL</span>
              <b>{money(subtotal + gst)}</b>
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? 'Saving…'
              : invoice
                ? 'Save changes'
                : 'Create invoice'}
          </Button>
        </div>
      </aside>
    </form>
  );
}

export default function Invoices() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [status, setStatus] = useState(() => {
    const value = searchParams.get('status');
    return [...statuses, 'Outstanding'].includes(value) ? value : '';
  });
  const [page, setPage] = useState(1);
  const [appliedSearch, setAppliedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewPendingId, setViewPendingId] = useState(null);
  const query = useQuery({
    queryKey: ['invoices', page, status, appliedSearch],
    queryFn: async ({ signal }) =>
      (
        await api.get('/invoices', {
          signal,
          params: {
            page,
            ...(appliedSearch && { search: appliedSearch }),
            ...(status === 'Overdue' || status === 'Outstanding'
              ? { view: status.toLowerCase() }
              : status
                ? { status }
                : {}),
          },
        })
      ).data.data,
  });
  const remove = useMutation({
    mutationFn: async (id) => (await api.delete(`/invoices/${id}`)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDeleting(null);
    },
  });
  const rows = query.data?.items || [];
  const getPdf = async (invoice) =>
    (
      await api.get(`/invoices/${invoice._id}/download`, {
        responseType: 'blob',
      })
    ).data;
  const download = async (invoice) => {
    const url = URL.createObjectURL(await getPdf(invoice));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${invoice.invoiceNumber}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const view = async (invoice) => {
    setViewPendingId(invoice._id);
    try {
      setViewing({ invoice, url: URL.createObjectURL(await getPdf(invoice)) });
    } finally {
      setViewPendingId(null);
    }
  };
  const closeView = () => {
    if (viewing?.url) URL.revokeObjectURL(viewing.url);
    setViewing(null);
  };
  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-2 inline-flex rounded-full bg-[#e6f4fd] px-3 py-1 text-[10px] font-bold text-[#006EB5]">
            FINANCE DOCUMENTS
          </span>
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#0d2344]">
            Invoice Management
          </h1>
          <p className="mt-1 text-xs text-[#6d8197]">
            Create invoices with manual service titles and branded PDF output.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} />
          New invoice
        </Button>
      </div>
      <div className="mb-4 grid gap-3 rounded-[18px] border border-[#e5edf5] bg-white p-4 sm:grid-cols-[1fr_180px]">
        <label className="flex min-h-10 items-center gap-2 rounded-xl border border-[#dce7f0] px-3">
          <Search size={15} className="text-[#7890a7]" />
          <input
            aria-label="Search invoices"
            className="w-full text-xs outline-none"
            placeholder="Search invoice or client"
            value={search}
            maxLength={80}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <select
          aria-label="Filter status"
          className="rounded-xl border border-[#dce7f0] px-3 text-xs"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="Outstanding">Outstanding</option>
          {statuses.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <section className="overflow-hidden rounded-[20px] border border-[#e5edf5] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="bg-[#f5f9fd] text-[9px] uppercase text-[#637991]">
                {[
                  'Invoice',
                  'Client',
                  'Invoice Date',
                  'Due Date',
                  'Total',
                  'Status',
                  'Actions',
                ].map((label) => (
                  <th
                    key={label}
                    className={`px-4 py-3 ${label === 'Actions' ? 'text-right' : ''}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((invoice) => (
                <tr
                  key={invoice._id}
                  className="border-t border-[#edf2f7] text-[10px]"
                >
                  <td className="px-4 py-3 font-bold text-[#0873bd]">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-4 py-3">
                    <b className="block">{invoice.client.company}</b>
                    <span className="text-[#71859a]">
                      {invoice.client.contactPerson}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {money(invoice.grandTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-lg px-2 py-1 font-semibold ${invoice.status === 'Paid' ? 'bg-[#ddf8ea] text-[#07875d]' : invoiceIsOverdue(invoice) || invoice.status === 'Cancelled' ? 'bg-[#fff0f1] text-[#bc4652]' : 'bg-[#eaf5fd] text-[#0873bd]'}`}
                    >
                      {invoiceIsOverdue(invoice) ? 'Overdue' : invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        title="View invoice"
                        aria-label={`View ${invoice.invoiceNumber}`}
                        disabled={viewPendingId === invoice._id}
                        onClick={() => view(invoice)}
                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#0873bd] hover:bg-[#eaf5fd] disabled:opacity-40"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        title="Download invoice"
                        aria-label={`Download ${invoice.invoiceNumber}`}
                        onClick={() => download(invoice)}
                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#0873bd] hover:bg-[#eaf5fd]"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        aria-label={`Edit ${invoice.invoiceNumber}`}
                        onClick={() => setEditing(invoice)}
                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#0873bd] hover:bg-[#eaf5fd]"
                      >
                        <FilePenLine size={14} />
                      </button>
                      <button
                        aria-label={`Delete ${invoice.invoiceNumber}`}
                        onClick={() => setDeleting(invoice)}
                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#bc4652] hover:bg-[#fff0f1]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {query.isPending && (
          <p className="p-8 text-center text-xs text-[#71859a]">
            Loading invoices…
          </p>
        )}
        {query.isError && (
          <p
            role="alert"
            className="m-4 rounded-xl bg-[#fff1f2] p-4 text-xs text-[#b53e49]"
          >
            Unable to load invoices.
          </p>
        )}
        {!query.isPending && !rows.length && (
          <div className="grid place-items-center p-12 text-center">
            <FileText size={30} className="text-[#8fc8e8]" />
            <p className="mt-3 text-xs text-[#71859a]">No invoices found.</p>
          </div>
        )}
      </section>
      <div className="my-4 flex items-center justify-between">
        <Button
          variant="secondary"
          disabled={page === 1 || query.isFetching}
          onClick={() => setPage((value) => value - 1)}
        >
          Previous invoice page
        </Button>
        <span className="text-xs text-slate-500">
          Page {page} / {Math.max(1, query.data?.pagination?.totalPages || 1)} -{' '}
          {query.data?.pagination?.total || 0} matching invoices
        </span>
        <Button
          variant="secondary"
          disabled={
            query.isFetching ||
            page >= (query.data?.pagination?.totalPages || 1)
          }
          onClick={() => setPage((value) => value + 1)}
        >
          Next invoice page
        </Button>
      </div>
      <HRMSDialog
        wide
        open={creating || Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        title={editing ? `Edit ${editing.invoiceNumber}` : 'Create invoice'}
        description="Enter client, payment and manual service-title details."
      >
        {(creating || editing) && (
          <InvoiceForm
            invoice={editing}
            onClose={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        )}
      </HRMSDialog>
      <HRMSDialog
        wide
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && closeView()}
        title={
          viewing ? `View ${viewing.invoice.invoiceNumber}` : 'View invoice'
        }
        description={viewing ? viewing.invoice.client.company : ''}
      >
        {viewing && (
          <div className="overflow-hidden rounded-2xl border border-[#dce7f0] bg-[#edf3f7]">
            <iframe
              title={`Preview ${viewing.invoice.invoiceNumber}`}
              src={viewing.url}
              className="h-[72vh] min-h-[560px] w-full bg-white"
            />
          </div>
        )}
      </HRMSDialog>
      <HRMSDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Archive invoice"
        description="The invoice will be removed from the active list."
      >
        <p className="rounded-xl bg-[#fff5f5] p-4 text-xs text-[#8e3d44]">
          Archive <b>{deleting?.invoiceNumber}</b> for{' '}
          {deleting?.client.company}?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => remove.mutate(deleting._id)}
            disabled={remove.isPending}
          >
            {remove.isPending ? 'Archiving…' : 'Archive'}
          </Button>
        </div>
      </HRMSDialog>
    </div>
  );
}
