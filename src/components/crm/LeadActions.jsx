import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import HRMSDialog from '../hrms/HRMSDialog.jsx';
import { Button } from '../ui/Button.jsx';
import { label } from '../../../shared/crm.js';
import {
  AssigneeSelect,
  Field,
  input,
  Message,
  useCRMMutation,
  useMetadata,
} from './CRMShared.jsx';
export function StageDialog({ lead, stage, onClose }) {
  const metadata = useMetadata();
  const [nextStage, setStage] = useState(stage || lead.stage);
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const mutation = useCRMMutation(
    async () =>
      (
        await api.post(`/crm/leads/${lead._id}/change-stage`, {
          stage: nextStage,
          lostReason: reason,
          lostDetail: detail,
        })
      ).data,
    onClose,
  );
  return (
    <HRMSDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Change lead stage"
      description={lead.companyName}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <Field label="Stage">
          <select
            className={input}
            value={nextStage}
            onChange={(event) => setStage(event.target.value)}
          >
            {metadata.data?.stages.map((value) => (
              <option key={value} value={value}>
                {metadata.data?.stageLabels[value] || label(value)}
              </option>
            ))}
          </select>
        </Field>
        {nextStage === 'LOST' && (
          <>
            <Field label="Lost reason">
              <select
                className={input}
                required
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              >
                <option value="">Choose reason</option>
                {metadata.data?.lostReasons.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>
            <Field label="Reason details">
              <textarea
                className={input}
                required={reason === 'Other'}
                maxLength={1000}
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
              />
            </Field>
          </>
        )}
        {nextStage === 'WON' && (
          <p className="rounded-xl bg-emerald-50 p-3 text-xs">
            Marking this lead won keeps its history. Review and convert it to a
            client using Convert to Client.
          </p>
        )}
        <Message mutation={mutation} />
        <Button disabled={mutation.isPending}>Update stage</Button>
      </form>
    </HRMSDialog>
  );
}
export function AssignDialog({ lead, onClose }) {
  const [owner, setOwner] = useState(
    lead.assignedTo?._id || lead.assignedTo || '',
  );
  const mutation = useCRMMutation(
    async () =>
      (await api.post(`/crm/leads/${lead._id}/assign`, { assignedTo: owner }))
        .data,
    onClose,
  );
  return (
    <HRMSDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Assign lead"
      description="Reassignment also transfers pending follow-ups and notifies the new owner."
    >
      <AssigneeSelect value={owner} onChange={setOwner} required />
      <Message mutation={mutation} />
      <Button
        className="mt-4"
        disabled={!owner || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Assign lead
      </Button>
    </HRMSDialog>
  );
}

export function ArchiveDialog({ lead, onClose }) {
  const navigate = useNavigate();
  const mutation = useCRMMutation(async () => (await api.delete(`/crm/leads/${lead._id}`)).data, () => navigate('/crm/leads'));
  return <HRMSDialog open onOpenChange={(open) => !open && onClose()} title="Archive lead" description="This preserves activity history. Converted or financially linked leads cannot be archived."><p className="text-sm">Archive {lead.companyName} ({lead.leadId})?</p><Message mutation={mutation} /><div className="mt-4 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>Confirm archive</Button></div></HRMSDialog>;
}
