import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { QuotationForm } from '../../pages/Quotations.jsx';
import HRMSDialog from '../hrms/HRMSDialog.jsx';
import { Button } from '../ui/Button.jsx';
import {
  can,
  date,
  Field,
  input,
  Message,
  money,
  Pager,
  panel,
  QueryState,
  useCRMMutation,
  useDebounced,
  usePermissions,
} from './CRMShared.jsx';

export function ConvertDialog({ lead, onClose }) {
  const [client, setClient] = useState(() =>
    Object.fromEntries(
      [
        'companyName',
        'contactPerson',
        'phone',
        'whatsapp',
        'email',
        'website',
        'address',
        'industry',
        'leadSource',
        'interestedServices',
      ].map((key) => [key, lead[key]]),
    ),
  );
  const [existing, setExisting] = useState('');
  const [search, setSearch] = useState(lead.companyName);
  const debounced = useDebounced(search);
  const candidates = useQuery({
    queryKey: ['crmClients', debounced],
    queryFn: async () =>
      (await api.get('/crm/clients', { params: { search: debounced } })).data
        .data.items,
  });
  const mutation = useCRMMutation(
    async () =>
      (
        await api.post(`/crm/leads/${lead._id}/convert`, {
          client,
          ...(existing ? { existingClientId: existing } : {}),
        })
      ).data,
    onClose,
  );
  return (
    <HRMSDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Convert Lead to Client"
      description="Review the company and contact details. Conversion preserves CRM history and links existing quotations."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            'companyName',
            'contactPerson',
            'phone',
            'whatsapp',
            'email',
            'website',
            'industry',
          ].map((key) => (
            <Field key={key} label={key}>
              <input
                className={input}
                type={
                  key === 'email' ? 'email' : key === 'website' ? 'url' : 'text'
                }
                value={client[key] || ''}
                required={key === 'companyName'}
                onChange={(event) =>
                  setClient({ ...client, [key]: event.target.value })
                }
              />
            </Field>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {['addressLine', 'city', 'state', 'country', 'pincode'].map((key) => (
            <Field key={key} label={key}>
              <input
                className={input}
                value={client.address?.[key] || ''}
                onChange={(event) =>
                  setClient({
                    ...client,
                    address: { ...client.address, [key]: event.target.value },
                  })
                }
              />
            </Field>
          ))}
        </div>
        <p className="text-xs">
          Source: {client.leadSource} · Account manager:{' '}
          {lead.assignedTo?.name || 'Unassigned'} · Services:{' '}
          {client.interestedServices.join(', ') || 'None selected'}
        </p>
        <Field label="Review existing clients">
          <input
            className={input}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company"
          />
          <select
            className={input}
            value={existing}
            onChange={(event) => setExisting(event.target.value)}
          >
            <option value="">Create a new client</option>
            {candidates.data?.map((item) => (
              <option value={item._id} key={item._id}>
                {item.clientId} · {item.companyName}
              </option>
            ))}
          </select>
        </Field>
        {candidates.isError && (
          <p role="alert" className="text-xs text-rose-700">
            Unable to check existing clients. Retry before converting.
          </p>
        )}
        <Message mutation={mutation} />
        <Button
          disabled={
            mutation.isPending || candidates.isError || candidates.isPending
          }
        >
          {existing ? 'Link existing client' : 'Confirm conversion'}
        </Button>
      </form>
    </HRMSDialog>
  );
}
export function LeadQuotations({ lead }) {
  const [create, setCreate] = useState(false);
  const [page, setPage] = useState(1);
  const permissions = usePermissions();
  const query = useQuery({
    queryKey: ['leadQuotations', lead._id, page],
    queryFn: async () =>
      (await api.get(`/crm/leads/${lead._id}/quotations`, { params: { page } }))
        .data.data,
    enabled: can(permissions, 'quotations.read'),
  });
  if (!can(permissions, 'quotations.read'))
    return <p role="alert">You do not have quotation access.</p>;
  return (
    <div className="space-y-4">
      {can(permissions, 'quotations.manage') && (
        <Button onClick={() => setCreate(true)}>Create Quotation</Button>
      )}
      <QueryState query={query}>
        <section className={panel}>
          {query.data?.items.map((item) => (
            <div
              key={item._id}
              className="flex flex-wrap justify-between gap-3 border-b py-3 text-xs"
            >
              <div>
                <strong>{item.quotationNumber}</strong>
                <p>
                  {item.title} · {item.status}
                </p>
              </div>
              <strong>
                {(item.services?.length ? item.services : [item.service])
                  .map(
                    (service) =>
                      `${service}: ${money(item.serviceTotals?.find((entry) => entry.service === service)?.total ?? item.items?.filter((row) => (row.service || item.service) === service).reduce((sum, row) => sum + Number(row.amount || 0), 0))}`,
                  )
                  .join(' � ')}
              </strong>
              <Link
                to={`/quotations?search=${encodeURIComponent(item.quotationNumber)}`}
                className="text-blue-700"
              >
                View quotation
              </Link>
            </div>
          ))}
          {!query.data?.items.length && (
            <p className="text-xs text-slate-500">
              No quotations linked to this lead.
            </p>
          )}
          <Pager
            pagination={query.data?.pagination}
            page={page}
            onPage={setPage}
          />
        </section>
      </QueryState>
      {create && (
        <HRMSDialog
          wide
          open
          onOpenChange={setCreate}
          title="Create quotation from lead"
          description="Review the prefilled contact and service details, then set pricing."
        >
          <QuotationForm lead={lead} onClose={() => setCreate(false)} />
        </HRMSDialog>
      )}
    </div>
  );
}
export function LeadDocuments({ lead }) {
  const permissions = usePermissions();
  const upload = useCRMMutation(async (file) => {
    const form = new FormData();
    form.append('file', file);
    return (await api.post(`/crm/leads/${lead._id}/documents`, form)).data;
  });
  const download = useCRMMutation(
    async (item) => {
      const { data } = await api.get(
        `/crm/leads/${lead._id}/documents/${item._id}`,
        { responseType: 'blob' },
      );
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.name;
      link.click();
      URL.revokeObjectURL(url);
      return { message: 'Document downloaded' };
    },
    undefined,
    [],
  );
  return (
    <section className={panel}>
      <h3 className="mb-4 text-sm font-bold">Documents</h3>
      {can(permissions, 'crm.leads.edit') && (
        <Field label="Upload PDF, PNG or JPEG (up to 10 MB)">
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className={input}
            disabled={upload.isPending}
            onChange={(event) => {
              if (event.target.files[0]) upload.mutate(event.target.files[0]);
              event.target.value = '';
            }}
          />
        </Field>
      )}
      <Message mutation={upload} />
      <Message mutation={download} />
      {lead.attachments.map((item) => (
        <div
          key={item._id}
          className="mt-4 flex items-center justify-between gap-3 text-xs"
        >
          <span>
            {item.name} · {Math.ceil(item.size / 1024)} KB ·{' '}
            {date(item.addedAt)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => download.mutate(item)}
          >
            Download
          </Button>
        </div>
      ))}
      {!lead.attachments.length && (
        <p className="mt-5 text-xs text-slate-500">No documents uploaded.</p>
      )}
    </section>
  );
}
