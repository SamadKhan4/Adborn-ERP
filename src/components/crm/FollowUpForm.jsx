import { api } from '../../services/api.js';
import { useState } from 'react';
import { followUpTypes, label } from '../../../shared/crm.js';
import HRMSDialog from '../hrms/HRMSDialog.jsx';
import { Button } from '../ui/Button.jsx';
import { Field, input, Message, useCRMMutation, useMetadata } from './CRMShared.jsx';
export default function FollowUpForm({
  leadId,
  record,
  action = 'create',
  onClose,
}) {
  const metadata = useMetadata();
  const [openedAt] = useState(() => new Date());
  const suggested = new Date(openedAt.getTime() + (metadata.data?.defaultFollowUpDays || 1) * 86400000);
  suggested.setMinutes(suggested.getMinutes() - suggested.getTimezoneOffset());
  const mutation = useCRMMutation(
    async (body) =>
      (
        await api.post(
          action === 'create'
            ? `/crm/leads/${leadId}/follow-ups`
            : `/crm/follow-ups/${record._id}/${action}`,
          body,
        )
      ).data,
    onClose,
  );
  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const datetime = (key) => new Date(form.get(key)).toISOString();
    mutation.mutate(
      action === 'complete'
        ? {
            outcome: form.get('outcome'),
            ...(form.get('nextFollowUpAt')
              ? {
                  nextFollowUpAt: datetime('nextFollowUpAt'),
                  nextNotes: form.get('notes'),
                }
              : {}),
          }
        : action === 'reschedule'
          ? { scheduledAt: datetime('scheduledAt'), notes: form.get('notes') }
          : {
              type: form.get('type'),
              scheduledAt: datetime('scheduledAt'),
              priority: form.get('priority'),
              notes: form.get('notes'),
            },
    );
  };
  return (
    <HRMSDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={
        action === 'complete'
          ? 'Complete follow-up'
          : action === 'reschedule'
            ? 'Reschedule follow-up'
            : 'Add follow-up'
      }
      description={
        record
          ? `${record.followUpId} · ${record.lead?.companyName || ''}`
          : 'Schedule the next interaction for the lead owner.'
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {action === 'create' && (
          <>
            <Field label="Type">
              <select className={input} name="type">
                {followUpTypes.map((value) => (
                  <option key={value} value={value}>
                    {label(value)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select className={input} name="priority" defaultValue="MEDIUM">
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>
          </>
        )}
        {action === 'complete' ? (
          <>
            <Field label="Outcome">
              <textarea
                className={input}
                name="outcome"
                required
                maxLength={3000}
              />
            </Field>
            <Field label="Optional next follow-up">
              <input
                type="datetime-local"
                name="nextFollowUpAt"
                className={input}
              />
            </Field>
          </>
        ) : (
          <Field label="Scheduled date and time">
            <input
              className={input}
              type="datetime-local"
              name="scheduledAt"
              defaultValue={metadata.data ? suggested.toISOString().slice(0, 16) : undefined}
              disabled={metadata.isPending}
              required
            />
          </Field>
        )}
        <Field label="Notes">
          <textarea
            className={input}
            name="notes"
            maxLength={3000}
            defaultValue={record?.notes || ''}
          />
        </Field>
        <Message mutation={mutation} />
        <Button disabled={mutation.isPending}>Save follow-up</Button>
      </form>
    </HRMSDialog>
  );
}
