import { useState } from 'react';
import { api } from '../../services/api.js';
import HRMSDialog from '../hrms/HRMSDialog.jsx';
import { Button } from '../ui/Button.jsx';
import { manualActivityTypes, label } from '../../../../shared/crm.js';
import { Field, input, Message, useCRMMutation } from './CRMShared.jsx';
export default function ActivityForm({ leadId, type = 'NOTE', onClose }) {
  const [selectedType, setType] = useState(type);
  const mutation = useCRMMutation(
    async (body) =>
      (await api.post(`/crm/leads/${leadId}/activities`, body)).data,
    onClose,
  );
  return (
    <HRMSDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Log lead activity"
      description="Record the interaction and its outcome. This logs activity without sending a message."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          mutation.mutate({
            type: selectedType,
            title: form.get('title'),
            description: form.get('description'),
            ...(form.get('scheduledAt')
              ? { scheduledAt: new Date(form.get('scheduledAt')).toISOString() }
              : {}),
          });
        }}
      >
        <Field label="Activity type">
          <select
            className={input}
            value={selectedType}
            onChange={(event) => setType(event.target.value)}
          >
            {manualActivityTypes.map((value) => (
              <option key={value} value={value}>
                {label(value)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title">
          <input name="title" className={input} required maxLength={180} />
        </Field>
        <Field label="Description / outcome">
          <textarea name="description" className={input} maxLength={5000} />
        </Field>
        {['MEETING', 'DEMO'].includes(selectedType) && (
          <Field label="Meeting time">
            <input
              name="scheduledAt"
              type="datetime-local"
              className={input}
              required
            />
          </Field>
        )}
        <Message mutation={mutation} />
        <Button disabled={mutation.isPending}>Save activity</Button>
      </form>
    </HRMSDialog>
  );
}
