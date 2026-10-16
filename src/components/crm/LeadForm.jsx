import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import {
  createLeadSchema,
  updateLeadSchema,
} from '../../../shared/crmValidation.js';
import { label } from '../../../shared/crm.js';
import HRMSDialog from '../hrms/HRMSDialog.jsx';
import { Button } from '../ui/Button.jsx';
import {
  AssigneeSelect,
  can,
  Field,
  input,
  Message,
  useCRMMutation,
  useDebounced,
  useMetadata,
  usePermissions,
} from './CRMShared.jsx';

export default function LeadForm({ lead, onClose }) {
  const metadata = useMetadata();
  const permissions = usePermissions();
  const [form, setForm] = useState(() => ({
    companyName: '',
    contactPerson: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    industry: '',
    leadSource: 'Website',
    interestedServices: [],
    estimatedBudget: 0,
    currency: 'INR',
    priority: 'MEDIUM',
    temperature: 'WARM',
    stage: 'NEW',
    probability: 0,
    address: {},
    notes: '',
    tags: [],
    ...(lead || {}),
    assignedTo: lead?.assignedTo?._id || lead?.assignedTo || '',
  }));
  const [tagsText, setTagsText] = useState(lead?.tags.join(', ') || '');
  const [errors, setErrors] = useState([]);
  const [reviewed, setReviewed] = useState(false);
  const duplicateSearch = useDebounced(
    JSON.stringify({
      companyName: form.companyName,
      phone: form.phone,
      email: form.email,
    }),
  );
  const duplicates = useQuery({
    queryKey: ['crmDuplicates', duplicateSearch],
    queryFn: async () =>
      (
        await api.get('/crm/leads/duplicates', {
          params: JSON.parse(duplicateSearch),
        })
      ).data.data.items,
    enabled: !lead && form.companyName.length > 1,
  });
  const mutation = useCRMMutation(
    async (body) =>
      (
        await (lead
          ? api.patch(`/crm/leads/${lead._id}`, body)
          : api.post('/crm/leads', body))
      ).data,
    onClose,
  );
  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (['phone', 'email', 'companyName'].includes(key)) setReviewed(false);
  };
  const submit = (event) => {
    event.preventDefault();
    if (!lead && duplicates.data?.length && !reviewed) {
      setErrors(['Review possible duplicates and confirm before creating.']);
      return;
    }
    const keys = [
      'companyName',
      'contactPerson',
      'phone',
      'whatsapp',
      'email',
      'website',
      'industry',
      'address',
      'leadSource',
      'interestedServices',
      'estimatedBudget',
      'currency',
      'priority',
      'temperature',
      'expectedClosingDate',
      'probability',
      'notes',
      'tags',
    ];
    const payload = Object.fromEntries(
      keys
        .filter((key) => form[key] !== undefined)
        .map((key) => [
          key,
          key === 'expectedClosingDate' ? form[key] || null : form[key],
        ]),
    );
    if (!lead)
      Object.assign(payload, {
        stage: form.stage,
        ...(form.assignedTo ? { assignedTo: form.assignedTo } : {}),
        ...(form.nextFollowUpAt
          ? { nextFollowUpAt: new Date(form.nextFollowUpAt).toISOString() }
          : {}),
        lostReason: form.lostReason || '',
        lostDetail: form.lostDetail || '',
      });
    payload.tags = tagsText
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const parsed = (lead ? updateLeadSchema : createLeadSchema).safeParse(
      payload,
    );
    if (!parsed.success) {
      setErrors(
        parsed.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`,
        ),
      );
      return;
    }
    setErrors([]);
    mutation.mutate(parsed.data);
  };
  const text = (key, title, type = 'text', required = false, extra = {}) => (
    <Field key={key} label={title}>
      <input
        className={input}
        type={type}
        required={required}
        value={
          type === 'date' ? form[key]?.slice(0, 10) || '' : (form[key] ?? '')
        }
        onChange={(event) => set(key, event.target.value)}
        {...extra}
      />
    </Field>
  );
  const select = (key, title, values) => (
    <Field key={key} label={title}>
      <select
        className={input}
        value={form[key]}
        onChange={(event) => set(key, event.target.value)}
      >
        {values.map((value) => (
          <option key={value} value={value}>
            {label(value)}
          </option>
        ))}
      </select>
    </Field>
  );
  return (
    <HRMSDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={lead ? 'Edit Lead' : 'Add Lead'}
      description="Capture contact details, sales ownership, and follow-up information."
    >
      <form onSubmit={submit} className="space-y-5">
        {errors.length > 0 && (
          <div
            role="alert"
            className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700"
          >
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
        <Message mutation={mutation} />
        {!lead && duplicates.data?.length > 0 && (
          <div className="rounded-xl bg-amber-50 p-3 text-xs">
            <strong>Possible duplicate lead found</strong>
            {duplicates.data.map((item) => (
              <Link
                key={item._id}
                to={`/crm/leads/${item._id}`}
                className="mt-1 block text-blue-700"
              >
                {item.leadId} · {item.companyName}
              </Link>
            ))}
            <label className="mt-3 block">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(event) => setReviewed(event.target.checked)}
              />{' '}
              I reviewed these leads. Create a separate company opportunity.
              Matching phone/email will still be rejected.
            </label>
          </div>
        )}
        <fieldset>
          <legend className="mb-3 text-sm font-bold">Basic information</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {text('companyName', 'Company name', 'text', true, {
              maxLength: 160,
            })}
            {text('contactPerson', 'Contact person')}
            {text('phone', 'Phone', 'tel', false, {
              pattern: '[+0-9 ().-]{7,30}',
            })}
            {text('whatsapp', 'WhatsApp', 'tel')}
            {text('email', 'Email', 'email')}
            {text('website', 'Website', 'url')}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-3 text-sm font-bold">
            Business information
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {text('industry', 'Industry')}
            {select(
              'leadSource',
              'Lead source',
              metadata.data?.sources || ['Website'],
            )}
            {text('estimatedBudget', 'Estimated budget', 'number', false, {
              min: 0,
              max: 1e10,
            })}
            {select('currency', 'Currency', ['INR', 'USD', 'EUR', 'GBP'])}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {metadata.data?.serviceCatalog.map((service) => (
              <label key={service.id} className="text-xs">
                <input
                  type="checkbox"
                  checked={form.interestedServices.includes(service.id)}
                  onChange={(event) =>
                    set(
                      'interestedServices',
                      event.target.checked
                        ? [...form.interestedServices, service.id]
                        : form.interestedServices.filter(
                            (item) => item !== service.id,
                          ),
                    )
                  }
                />{' '}
                {service.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-3 text-sm font-bold">Sales information</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {!lead && can(permissions, 'crm.leads.assign') && (
              <Field label="Assigned employee">
                <AssigneeSelect
                  value={form.assignedTo}
                  onChange={(value) => set('assignedTo', value)}
                />
              </Field>
            )}
            {select(
              'priority',
              'Priority',
              metadata.data?.priorities || ['MEDIUM'],
            )}
            {select(
              'temperature',
              'Temperature',
              metadata.data?.temperatures || ['WARM'],
            )}
            {!lead &&
              select(
                'stage',
                'Initial stage',
                metadata.data?.stages || ['NEW'],
              )}
            {text('expectedClosingDate', 'Expected closing date', 'date')}
            {text('probability', 'Probability %', 'number', false, {
              min: 0,
              max: 100,
            })}
            {!lead &&
              can(permissions, 'crm.followups.create') &&
              text(
                'nextFollowUpAt',
                'Next follow-up (local time)',
                'datetime-local',
              )}
            {form.stage === 'LOST' && !lead && (
              <>
                {select(
                  'lostReason',
                  'Lost reason',
                  metadata.data?.lostReasons || [],
                )}
                {text('lostDetail', 'Lost reason details')}
              </>
            )}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-3 text-sm font-bold">Address</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {['addressLine', 'city', 'state', 'country', 'pincode'].map(
              (key) => (
                <Field key={key} label={label(key)}>
                  <input
                    className={input}
                    value={form.address?.[key] || ''}
                    onChange={(event) =>
                      set('address', {
                        ...form.address,
                        [key]: event.target.value,
                      })
                    }
                  />
                </Field>
              ),
            )}
          </div>
        </fieldset>
        <Field label="Notes">
          <textarea
            className={input}
            maxLength={5000}
            value={form.notes}
            onChange={(event) => set('notes', event.target.value)}
          />
        </Field>
        <Field label="Tags (comma separated)">
          <input
            className={input}
            value={tagsText}
            onChange={(event) => setTagsText(event.target.value)}
          />
        </Field>
        {!lead && (
          <p className="text-xs text-slate-500">
            Save the lead to securely upload attachments from its Documents tab.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={mutation.isPending || metadata.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save Lead'}
          </Button>
        </div>
      </form>
    </HRMSDialog>
  );
}
