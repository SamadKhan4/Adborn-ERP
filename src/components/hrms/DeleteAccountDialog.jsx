import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import HRMSDialog from './HRMSDialog.jsx';
import { Button } from '../ui/Button.jsx';

export default function DeleteAccountDialog({ account, endpoint, onClose }) {
  const [confirmation, setConfirmation] = useState('');
  const [cleanupPending, setCleanupPending] = useState(null);
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.delete(`${endpoint}/${account._id}/permanent`, {
          data: { confirmation },
          timeout: 120000,
        })
      ).data,
    onSuccess: async (payload) => {
      await client.invalidateQueries();
      if (payload.data.cleanupPending)
        setCleanupPending(payload.data.cleanupPending);
      else onClose();
    },
  });
  return (
    <HRMSDialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
      title="Permanently delete account"
      description="This action cannot be undone."
    >
      {cleanupPending !== null ? (
        <>
          <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm">
            Account and database records deleted. {cleanupPending} stored files
            are queued for automatic cleanup.
          </p>
          <Button className="mt-4" onClick={onClose}>
            Close
          </Button>
        </>
      ) : (
        <>
          <p className="rounded-xl bg-red-50 p-4 text-xs leading-6 text-red-800">
            Permanently delete <strong>{account.name}</strong> ({account.email})
            and all their personal/HR records, documents, payroll entries, CRM
            leads, clients, quotations, invoices, projects and related team
            work. Other employees' accounts and HR records will be preserved.
            Their login access will end immediately.
          </p>
          <label className="mt-4 block text-xs font-semibold">
            Type {account.email} to confirm
            <input
              aria-label="Confirm deletion email"
              type="email"
              autoComplete="off"
              value={confirmation}
              disabled={mutation.isPending}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>
          {mutation.isError && (
            <p role="alert" className="mt-3 text-xs text-red-700">
              {mutation.error.response?.data?.error?.message ||
                'Deletion failed. Please retry.'}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-3">
            <Button
              variant="secondary"
              disabled={mutation.isPending}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              disabled={mutation.isPending || confirmation !== account.email}
              onClick={() => mutation.mutate()}
              className="bg-red-700 text-white"
            >
              {mutation.isPending ? 'Deleting...' : 'Delete permanently'}
            </Button>
          </div>
        </>
      )}
    </HRMSDialog>
  );
}
