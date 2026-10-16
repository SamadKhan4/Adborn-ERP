import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { Button } from '../../components/ui/Button.jsx';
import HRMSDialog from '../../components/hrms/HRMSDialog.jsx';
import { InvoiceForm } from '../Invoices.jsx';
import {
  can,
  date,
  Field,
  input,
  Message,
  money,
  panel,
  QueryState,
  useCRMMutation,
  useMetadata,
  usePermissions,
} from '../../components/crm/CRMShared.jsx';
function ProjectForm({ clientId, leads, quotations, onClose }) {
  const metadata = useMetadata();
  const mutation = useCRMMutation(
    async (body) =>
      (await api.post(`/crm/clients/${clientId}/projects`, body)).data,
    onClose,
    ['crmClient', 'leadActivities'],
  );
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const body = Object.fromEntries(
          [...form.entries()].filter(([, value]) => value),
        );
        mutation.mutate(body);
      }}
    >
      <Field label="Originating lead">
        <select className={input} name="lead" required>
          {leads.map((lead) => (
            <option key={lead._id} value={lead._id}>
              {lead.leadId}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Project / service title">
        <input className={input} name="title" required maxLength={180} />
      </Field>
      <Field label="Service">
        <select className={input} name="service" required>
          {metadata.data?.serviceCatalog.map((service) => (
            <option key={service.id} value={service.id}>
              {service.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Quotation (optional)">
        <select className={input} name="quotation">
          <option value="">No quotation</option>
          {quotations.map((item) => (
            <option key={item._id} value={item._id}>
              {item.quotationNumber}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Billing type">
        <select className={input} name="billingType">
          {['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY'].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </Field>
      <Field label="Amount per billing period">
        <input
          className={input}
          name="amount"
          type="number"
          min="0"
          max="10000000000"
          required
        />
      </Field>
      <Field label="Start date">
        <input className={input} name="startDate" type="date" />
      </Field>
      <Field label="Next billing date (required for recurring services)">
        <input className={input} name="nextBillingAt" type="date" />
      </Field>
      <Field label="Notes">
        <textarea className={input} name="notes" maxLength={3000} />
      </Field>
      <Message mutation={mutation} />
      <Button disabled={mutation.isPending}>Create project / service</Button>
    </form>
  );
}
export default function ClientDetail() {
  const { id } = useParams();
  const permissions = usePermissions();
  const [create, setCreate] = useState(false);
  const [billing, setBilling] = useState(null);
  const query = useQuery({
    queryKey: ['crmClient', id],
    queryFn: async () => (await api.get(`/crm/clients/${id}`)).data.data,
  });
  const data = query.data;
  return (
    <QueryState query={query}>
      {data && (
        <div className="space-y-5">
          <section className={panel}>
            <p className="text-xs text-slate-500">{data.client.clientId}</p>
            <h2 className="mt-2 text-2xl font-bold">
              {data.client.companyName}
            </h2>
            <p className="mt-3 text-xs">
              {data.client.contactPerson} · {data.client.phone} ·{' '}
              {data.client.email}
            </p>
            <p className="mt-2 text-xs">
              Source: {data.client.leadSource} · Sales owner:{' '}
              {data.leads[0]?.assignedTo?.name}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {data.leads.map((lead) => (
                <Link
                  className="text-xs text-blue-700"
                  key={lead._id}
                  to={`/crm/leads/${lead._id}`}
                >
                  Originating lead: {lead.leadId}
                </Link>
              ))}
            </div>
          </section>
          <section className={panel}>
            <div className="flex justify-between">
              <h3 className="text-sm font-bold">
                Projects & recurring services
              </h3>
              {can(permissions, 'crm.leads.convert') && (
                <Button size="sm" onClick={() => setCreate(true)}>
                  Create Project / Service
                </Button>
              )}
            </div>
            {data.projects.map((project) => (
              <div
                key={project._id}
                className="mt-4 rounded-xl border p-4 text-xs"
              >
                <strong>
                  {project.projectId} · {project.title}
                </strong>
                <p className="mt-2">
                  {project.service} · {project.billingType} · {project.status} ·{' '}
                  {money(project.amount, project.currency)}
                </p>
                <p className="mt-2">
                  Next billing: {date(project.nextBillingAt)}
                </p>
                {can(permissions, 'invoices.manage') && (
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="secondary"
                    onClick={() => setBilling({ project })}
                  >
                    Create linked invoice
                  </Button>
                )}
              </div>
            ))}
            {!data.projects.length && (
              <p className="mt-5 text-xs text-slate-500">
                No projects or services created.
              </p>
            )}
          </section>
          <section className={panel}>
            <h3 className="text-sm font-bold">Quotations (latest 50)</h3>
            {data.quotations.map((item) => (
              <div
                key={item._id}
                className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <Link
                  className="text-blue-700"
                  to={`/quotations?search=${encodeURIComponent(item.quotationNumber)}`}
                >
                  {item.quotationNumber} · {item.status} ·{' '}
                  {money(item.grandTotal)}
                </Link>
                {can(permissions, 'invoices.manage') && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setBilling({ quotation: item })}
                  >
                    Create linked invoice
                  </Button>
                )}
              </div>
            ))}
          </section>
          <section className={panel}>
            <h3 className="text-sm font-bold">
              Invoices & payment status (latest 50)
            </h3>
            {data.invoices.map((item) => (
              <p key={item._id} className="mt-3 text-xs">
                <Link
                  className="text-blue-700"
                  to={`/invoices?search=${encodeURIComponent(item.invoiceNumber)}`}
                >
                  {item.invoiceNumber}
                </Link>{' '}
                · {item.status} · {money(item.grandTotal)}
              </p>
            ))}
            {!data.invoices.length && (
              <p className="mt-4 text-xs text-slate-500">No invoices linked.</p>
            )}
          </section>
          {create && (
            <HRMSDialog
              open
              onOpenChange={setCreate}
              title="Create project / service"
              description="Use this client's originating lead and quotation to preserve traceability."
            >
              <ProjectForm
                clientId={id}
                leads={data.leads}
                quotations={data.quotations}
                onClose={() => setCreate(false)}
              />
            </HRMSDialog>
          )}
          {billing && (
            <HRMSDialog
              wide
              open
              onOpenChange={(open) => !open && setBilling(null)}
              title="Create linked invoice"
              description="Review the prefilled client information, line item, tax, and bank details."
            >
              <InvoiceForm
                business={{ client: data.client, ...billing }}
                onClose={() => {
                  setBilling(null);
                  query.refetch();
                }}
              />
            </HRMSDialog>
          )}
        </div>
      )}
    </QueryState>
  );
}
