import { useMemo, useState } from 'react';
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

const services = [
  ['web', 'Website Development'],
  ['social_media', 'Social Media Management'],
  ['seo', 'SEO'],
  ['graphics', 'Graphics Design'],
  ['video', 'Video Production'],
  ['meta_ads', 'Meta Ads'],
  ['google_ads', 'Google Ads'],
];
const serviceLabels = Object.fromEntries(services);
const selectedServicesOf = (quotation) =>
  quotation.services?.length
    ? quotation.services
    : [quotation.service].filter(Boolean);
const defaultTerms = [
  'Advance payment is required. GST is subject to applicability.',
  'Meta Ads and Google Ads media budgets are payable separately.',
  'Domain and hosting charges are additional, if required.',
  'Custom requirements can be discussed and quoted separately.',
];
const emptyParty = {
  company: '',
  contactPerson: '',
  contactNumber: '',
  email: '',
};
const inputClass =
  'mt-1.5 min-h-10 w-full rounded-xl border border-[#dce7f0] bg-white px-3 text-xs text-[#173958] outline-none focus:border-[#0987C4] focus:ring-4 focus:ring-[#0987c414]';
const money = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const initialForm = () => ({
  serviceTotals: [{ service: 'Service 1', total: '' }],
  services: ['Service 1'],
  title: 'Service quotation',
  client: { ...emptyParty },
  items: [{ service: 'Service 1', description: '', amount: '' }],
  terms: [...defaultTerms],
  gstRate: 0,
  status: 'Draft',
  validUntil: '',
  notes: '',
});
const fromQuotation = (quotation) => ({
  ...quotation,
  services: selectedServicesOf(quotation),
  serviceTotals: selectedServicesOf(quotation).map((service) => ({
    service,
    total:
      quotation.serviceTotals?.find((entry) => entry.service === service)
        ?.total ??
      quotation.items
        .filter(
          (item) =>
            (item.service || selectedServicesOf(quotation)[0]) === service,
        )
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
  })),
  client: { ...quotation.client },
  items: quotation.items.map(({ service, description, amount }) => ({
    service: service || selectedServicesOf(quotation)[0],
    description,
    amount: amount ?? '',
  })),
  terms: [...quotation.terms],
  validUntil: quotation.validUntil?.slice(0, 10) || '',
});

function Field({ label, children }) {
  return (
    <label className="block text-[10px] font-semibold text-[#31516f]">
      {label}
      {children}
    </label>
  );
}

export function QuotationForm({ quotation, lead, onClose }) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(() =>
    quotation
      ? fromQuotation(quotation)
      : lead
        ? {
            ...initialForm(),
            serviceTotals: (lead.interestedServices.length
              ? lead.interestedServices
              : ['web']
            ).map((service) => ({ service, total: '' })),
            services: lead.interestedServices.length
              ? lead.interestedServices
              : ['web'],
            title: `${lead.companyName} - Proposal`,
            client: {
              company: lead.companyName,
              contactPerson: lead.contactPerson,
              contactNumber: lead.phone,
              email: lead.email,
            },
            items: (lead.interestedServices.length
              ? lead.interestedServices
              : ['web']
            ).map((service) => ({
              service,
              description: serviceLabels[service] || service,
              amount: '',
            })),
          }
        : initialForm(),
  );
  const mutation = useMutation({
    mutationFn: async (payload) =>
      quotation
        ? (await api.put(`/quotations/${quotation._id}`, payload)).data
        : (
            await api.post(
              lead ? `/crm/leads/${lead._id}/quotations` : '/quotations',
              payload,
            )
          ).data,
    onSuccess: async () => {
      await Promise.all(
        ['quotations', 'leadQuotations', 'leadActivities', 'lead'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      );
      onClose();
    },
  });
  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setParty = (party, key, value) =>
    setForm((current) => ({
      ...current,
      [party]: { ...current[party], [key]: value },
    }));
  const updateItem = (index, key, value) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  const renameService = (service, name) => {
    if (
      form.services.some(
        (value) => value !== service && value.trim() === name.trim(),
      )
    ) {
      setFormError('Please use a different title for each service.');
      return;
    }
    setFormError('');
    setForm((current) => ({
      ...current,
      services: current.services.map((value) =>
        value === service ? name : value,
      ),
      items: current.items.map((item) =>
        item.service === service ? { ...item, service: name } : item,
      ),
      serviceTotals: current.serviceTotals.map((entry) =>
        entry.service === service ? { ...entry, service: name } : entry,
      ),
    }));
  };
  const addService = () =>
    setForm((current) => {
      let name = 'New service';
      let index = 2;
      while (current.services.includes(name)) name = `New service ${index++}`;
      return {
        ...current,
        services: [...current.services, name],
        items: [
          ...current.items,
          { service: name, description: '', amount: '' },
        ],
        serviceTotals: [...current.serviceTotals, { service: name, total: '' }],
      };
    });
  const removeService = (service) =>
    setForm((current) => ({
      ...current,
      services: current.services.filter((value) => value !== service),
      items: current.items.filter((item) => item.service !== service),
      serviceTotals: current.serviceTotals.filter(
        (entry) => entry.service !== service,
      ),
    }));
  const submit = (event) => {
    event.preventDefault();
    const payload = {
      services: form.services.map((service) => service.trim()),
      serviceTotals: form.serviceTotals.map((entry) => ({
        service: entry.service.trim(),
        total: Number(entry.total),
      })),
      title: form.title,
      client: form.client,
      items: form.items
        .map((item) => ({
          service: item.service.trim(),
          description: item.description.trim(),
          ...(item.amount === '' ? {} : { amount: Number(item.amount) }),
        }))
        .filter((item) => item.description),
      terms: form.terms.filter(Boolean),
      gstRate: Number(form.gstRate),
      status: form.status,
      ...(form.validUntil ? { validUntil: form.validUntil } : {}),
      ...(form.notes ? { notes: form.notes } : {}),
    };
    mutation.mutate(payload);
  };
  const error =
    formError ||
    mutation.error?.response?.data?.error?.message ||
    mutation.error?.message;
  return (
    <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <section className="grid gap-4 rounded-2xl bg-[#f7fafd] p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold">Service titles</p>
            <p className="mt-2 text-xs text-[#7890a7]">
              Type each service title below. Add or remove services as needed.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-3"
              disabled={form.services.length >= 20}
              onClick={addService}
            >
              <Plus size={14} />
              Add service
            </Button>
          </div>
          <Field label="Quotation title">
            <input
              className={inputClass}
              value={form.title}
              onChange={(event) => set('title', event.target.value)}
              required
            />
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(event) => set('status', event.target.value)}
            >
              {['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'].map(
                (status) => (
                  <option key={status}>{status}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="Valid until">
            <input
              className={inputClass}
              type="date"
              value={form.validUntil}
              onChange={(event) => set('validUntil', event.target.value)}
            />
          </Field>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#d7e8f3] bg-[#f3f9fd] p-4">
            <h3 className="mb-3 text-xs font-bold text-[#087fc3]">
              Quotation from
            </h3>
            <div className="space-y-2 text-[10px] text-[#49657d]">
              <p>
                <strong className="text-[#173958]">AdBorn Solutions</strong>
              </p>
              <p>Team AdBorn Solutions</p>
              <p>+91 7488049134</p>
              <p>info@adbornsolutions.com</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[#e5edf5] p-4">
            <h3 className="mb-3 text-xs font-bold text-[#087fc3]">
              Quotation to
            </h3>
            <div className="space-y-3">
              {[
                ['company', 'Client / Company', 'text'],
                ['contactPerson', 'Contact Person', 'text'],
                ['contactNumber', 'Contact No.', 'tel'],
                ['email', 'Email (optional)', 'email'],
              ].map(([key, label, type]) => (
                <Field key={key} label={label}>
                  <input
                    className={inputClass}
                    type={type}
                    value={form.client[key]}
                    onChange={(event) =>
                      setParty('client', key, event.target.value)
                    }
                    required={key !== 'email'}
                  />
                </Field>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-bold">Price breakdown by service</h3>
            <p className="text-[9px] text-[#75889c]">
              Up to 100 rows per service. Row amounts are optional. Enter each
              service total manually; PDF tables share a page when space allows.
            </p>
          </div>
          {form.services.map((service, sectionIndex) => {
            const serviceItems = form.items
              .map((item, index) => ({ item, index }))
              .filter(({ item }) => item.service === service);
            return (
              <section
                key={sectionIndex}
                className="overflow-x-auto rounded-2xl border border-[#dfe8f1]"
              >
                <div className="flex items-center justify-between bg-[#edf7fd] px-4 py-3">
                  <div>
                    <Field label="Service title">
                      <input
                        aria-label={`Service title ${sectionIndex + 1}`}
                        className={inputClass}
                        value={serviceLabels[service] || service}
                        maxLength={120}
                        required
                        onChange={(event) =>
                          renameService(service, event.target.value)
                        }
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove service ${sectionIndex + 1}`}
                    disabled={form.services.length === 1}
                    onClick={() => removeService(service)}
                    className="px-3 text-xs text-red-600 disabled:opacity-30"
                  >
                    Remove service
                  </button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={serviceItems.length >= 100}
                    onClick={() =>
                      set('items', [
                        ...form.items,
                        { service, description: '', amount: '' },
                      ])
                    }
                  >
                    <Plus size={14} />
                    Add row
                  </Button>
                </div>
                <div className="grid min-w-[440px] grid-cols-[32px_minmax(180px,1fr)_100px_32px] bg-[#082f55] px-2 py-3 text-[9px] font-bold text-white">
                  <span>NO.</span>
                  <span>Service details</span>
                  <span>Amount</span>
                  <span />
                </div>
                {serviceItems.map(({ item, index }, serviceIndex) => (
                  <div
                    key={index}
                    className={`grid min-w-[440px] grid-cols-[32px_minmax(180px,1fr)_100px_32px] items-center gap-2 px-2 py-2 ${serviceIndex % 2 ? 'bg-[#f3f8fb]' : 'bg-white'}`}
                  >
                    <span className="text-xs font-semibold text-[#1593d0]">
                      {String(serviceIndex + 1).padStart(2, '0')}
                    </span>
                    <input
                      aria-label={`${serviceLabels[service] || service} detail ${serviceIndex + 1}`}
                      className="min-h-9 rounded-lg border border-[#dce7f0] px-2 text-xs"
                      value={item.description}
                      onChange={(event) =>
                        updateItem(index, 'description', event.target.value)
                      }
                      required
                    />
                    <input
                      aria-label={`${serviceLabels[service] || service} amount ${serviceIndex + 1}`}
                      className="min-h-9 rounded-lg border border-[#dce7f0] px-2 text-xs"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.amount}
                      onChange={(event) =>
                        updateItem(index, 'amount', event.target.value)
                      }
                      placeholder="Optional"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${serviceLabels[service] || service} row ${serviceIndex + 1}`}
                      className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#bd4a55] hover:bg-[#fff0f1]"
                      onClick={() =>
                        set(
                          'items',
                          form.items.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        )
                      }
                      disabled={serviceItems.length === 1}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="border-t border-[#dfe8f1] bg-[#f7fafd] p-4">
                  <Field label="Service total (manual)">
                    <input
                      aria-label={`Service total ${sectionIndex + 1}`}
                      type="number"
                      min="0"
                      max="100000000"
                      step="0.01"
                      required
                      className={inputClass}
                      value={
                        form.serviceTotals.find(
                          (entry) => entry.service === service,
                        )?.total ?? ''
                      }
                      onChange={(event) =>
                        set(
                          'serviceTotals',
                          form.serviceTotals.map((entry) =>
                            entry.service === service
                              ? { ...entry, total: event.target.value }
                              : entry,
                          ),
                        )
                      }
                    />
                  </Field>
                </div>
              </section>
            );
          })}
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Terms & Conditions - one per line">
            <textarea
              className={`${inputClass} min-h-32 py-3`}
              value={form.terms.join('\n')}
              onChange={(event) => set('terms', event.target.value.split('\n'))}
            />
          </Field>
          <div className="space-y-4">
            <Field label="Internal notes">
              <textarea
                className={`${inputClass} min-h-20 py-3`}
                value={form.notes}
                onChange={(event) => set('notes', event.target.value)}
              />
            </Field>
          </div>
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

      <aside className="h-fit rounded-[20px] border border-[#dfe8f1] bg-[#fbfdff] p-4 xl:sticky xl:top-4">
        <div className="border-t-[5px] border-[#082f55] bg-white p-4 shadow-[0_12px_35px_#315d8612]">
          <img
            src="/adborn_logo.png"
            alt="AdBorn Solutions"
            className="h-10 w-auto"
          />
          <div className="my-4 h-px bg-[#dce3e8]" />
          <h3 className="text-lg font-extrabold">QUOTATION</h3>
          <div className="mt-1 h-0.5 w-12 bg-[#2bb7e8]" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#f2f7fa] p-3">
              <p className="text-[9px] font-semibold text-[#1593d0]">
                QUOTATION FROM
              </p>
              <strong className="mt-2 block text-[9px]">
                AdBorn Solutions
              </strong>
              <p className="mt-1 text-[7px] text-[#6b7780]">
                info@adbornsolutions.com
              </p>
            </div>
            <div className="rounded-xl bg-[#f2f7fa] p-3">
              <p className="text-[9px] font-semibold text-[#1593d0]">
                QUOTATION TO
              </p>
              <strong className="mt-2 block text-[9px]">
                {form.client.company || 'Client / Company'}
              </strong>
              <p className="mt-1 text-[7px] text-[#6b7780]">
                {form.client.contactPerson || 'Contact person'}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {form.services.map((service, pageIndex) => {
              const serviceItems = form.items.filter(
                (item) => item.service === service,
              );
              return (
                <div
                  key={pageIndex}
                  className="rounded-lg border border-[#e4edf4] p-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-[9px] font-bold">
                      {(serviceLabels[service] || service).toUpperCase()}
                    </h4>
                    <span className="text-[7px] text-[#7890a7]">
                      SERVICE {pageIndex + 1}
                    </span>
                  </div>
                  <p className="mt-1 text-[8px] text-[#6b7780]">
                    {serviceItems.length} breakdown rows ·{' '}
                    {money(
                      form.serviceTotals.find(
                        (entry) => entry.service === service,
                      )?.total,
                    )}
                  </p>
                </div>
              );
            })}
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
              : quotation
                ? 'Save changes'
                : 'Create quotation'}
          </Button>
        </div>
      </aside>
    </form>
  );
}

export default function Quotations() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(
    () => new URLSearchParams(window.location.search).get('search') || '',
  );
  const [service, setService] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewPendingId, setViewPendingId] = useState(null);
  const query = useQuery({
    queryKey: ['quotations'],
    queryFn: async ({ signal }) =>
      (await api.get('/quotations', { signal })).data.data.items,
  });
  const remove = useMutation({
    mutationFn: async (id) => (await api.delete(`/quotations/${id}`)).data,
    onSuccess: async () => {
      await Promise.all(
        ['quotations', 'leadQuotations', 'leadActivities', 'lead'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      );
      setDeleting(null);
    },
  });
  const rows = useMemo(
    () =>
      (query.data || []).filter(
        (item) =>
          (!service || selectedServicesOf(item).includes(service)) &&
          (!status || item.status === status) &&
          `${item.quotationNumber} ${item.title} ${item.client.company}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [query.data, search, service, status],
  );
  const download = async (quotation) => {
    const response = await api.get(`/quotations/${quotation._id}/download`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${quotation.quotationNumber}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const view = async (quotation) => {
    setViewPendingId(quotation._id);
    try {
      const response = await api.get(`/quotations/${quotation._id}/download`, {
        responseType: 'blob',
      });
      setViewing({ quotation, url: URL.createObjectURL(response.data) });
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
            SALES DOCUMENTS
          </span>
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#0d2344]">
            Quotation Management
          </h1>
          <p className="mt-1 text-xs text-[#6d8197]">
            Create customized service quotations and download the branded PDF.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} />
          New quotation
        </Button>
      </div>
      <div className="mb-4 grid gap-3 rounded-[18px] border border-[#e5edf5] bg-white p-4 shadow-[0_9px_28px_#315d860b] sm:grid-cols-[1fr_200px_170px]">
        <label className="flex min-h-10 items-center gap-2 rounded-xl border border-[#dce7f0] px-3">
          <Search size={15} className="text-[#7890a7]" />
          <input
            aria-label="Search quotations"
            className="w-full text-xs outline-none"
            placeholder="Search number, title or client"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter service"
          className="rounded-xl border border-[#dce7f0] px-3 text-xs"
          value={service}
          onChange={(event) => setService(event.target.value)}
        >
          <option value="">All services</option>
          {[...new Set((query.data || []).flatMap(selectedServicesOf))].map(
            (value) => (
              <option key={value} value={value}>
                {serviceLabels[value] || value}
              </option>
            ),
          )}
        </select>
        <select
          aria-label="Filter status"
          className="rounded-xl border border-[#dce7f0] px-3 text-xs"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          {['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <section className="overflow-hidden rounded-[20px] border border-[#e5edf5] bg-white shadow-[0_12px_35px_#315d860c]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="bg-[#f5f9fd] text-[9px] uppercase tracking-wide text-[#637991]">
                {[
                  'Quotation',
                  'Client',
                  'Services',
                  'Service totals',
                  'Status',
                  'Created',
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
              {rows.map((quotation) => (
                <tr
                  key={quotation._id}
                  className="border-t border-[#edf2f7] text-[10px]"
                >
                  <td className="px-4 py-3">
                    <strong className="block text-[#153b5c]">
                      {quotation.quotationNumber}
                    </strong>
                    <span className="text-[#71859a]">{quotation.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <strong className="block">
                      {quotation.client.company}
                    </strong>
                    <span className="text-[#71859a]">
                      {quotation.client.contactPerson}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-64 flex-wrap gap-1">
                      {selectedServicesOf(quotation).map((value) => (
                        <span
                          key={value}
                          className="rounded-md bg-[#edf7fd] px-2 py-1 text-[#0873bd]"
                        >
                          {serviceLabels[value] || value}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {selectedServicesOf(quotation).map((service) => (
                      <div key={service}>
                        {serviceLabels[service] || service}:{' '}
                        {money(
                          quotation.serviceTotals?.find(
                            (entry) => entry.service === service,
                          )?.total ??
                            quotation.items
                              .filter(
                                (item) =>
                                  (item.service ||
                                    selectedServicesOf(quotation)[0]) ===
                                  service,
                              )
                              .reduce(
                                (sum, item) => sum + Number(item.amount || 0),
                                0,
                              ),
                        )}
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-lg px-2 py-1 font-semibold ${quotation.status === 'Accepted' ? 'bg-[#ddf8ea] text-[#07875d]' : quotation.status === 'Rejected' ? 'bg-[#fff0f1] text-[#bc4652]' : 'bg-[#eaf5fd] text-[#0873bd]'}`}
                    >
                      {quotation.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#637991]">
                    {new Date(quotation.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        aria-label={`View ${quotation.quotationNumber}`}
                        title="View quotation"
                        disabled={viewPendingId === quotation._id}
                        onClick={() => view(quotation)}
                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#0873bd] hover:bg-[#eaf5fd] disabled:opacity-40"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        aria-label={`Download ${quotation.quotationNumber}`}
                        title="Download quotation"
                        onClick={() => download(quotation)}
                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#0873bd] hover:bg-[#eaf5fd]"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        aria-label={`Edit ${quotation.quotationNumber}`}
                        onClick={() => setEditing(quotation)}
                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#0873bd] hover:bg-[#eaf5fd]"
                      >
                        <FilePenLine size={14} />
                      </button>
                      <button
                        aria-label={`Delete ${quotation.quotationNumber}`}
                        onClick={() => setDeleting(quotation)}
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
          <p role="status" className="p-8 text-center text-xs text-[#71859a]">
            Loading quotations…
          </p>
        )}
        {query.isError && (
          <p
            role="alert"
            className="m-4 rounded-xl bg-[#fff1f2] p-4 text-xs text-[#b53e49]"
          >
            Unable to load quotations.
          </p>
        )}
        {!query.isPending && !rows.length && (
          <div className="grid place-items-center p-12 text-center">
            <FileText size={30} className="text-[#8fc8e8]" />
            <p className="mt-3 text-xs text-[#71859a]">No quotations found.</p>
          </div>
        )}
      </section>
      <HRMSDialog
        wide
        open={creating || Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        title={editing ? `Edit ${editing.quotationNumber}` : 'Create quotation'}
        description="Add service titles, optional row amounts and a manual total for each service."
      >
        {(creating || editing) && (
          <QuotationForm
            quotation={editing}
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
          viewing
            ? `View ${viewing.quotation.quotationNumber}`
            : 'View quotation'
        }
        description={
          viewing
            ? `${viewing.quotation.client.company} · ${selectedServicesOf(
                viewing.quotation,
              )
                .map((value) => serviceLabels[value] || value)
                .join(', ')}`
            : ''
        }
      >
        {viewing && (
          <div className="overflow-hidden rounded-2xl border border-[#dce7f0] bg-[#edf3f7]">
            <iframe
              title={`Preview ${viewing.quotation.quotationNumber}`}
              src={viewing.url}
              className="h-[72vh] min-h-[560px] w-full bg-white"
            />
          </div>
        )}
      </HRMSDialog>
      <HRMSDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Archive quotation"
        description="The quotation will be removed from the active list."
      >
        <p className="rounded-xl bg-[#fff5f5] p-4 text-xs text-[#8e3d44]">
          Archive <strong>{deleting?.quotationNumber}</strong> for{' '}
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
