import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import HRMSDialog from '../hrms/HRMSDialog.jsx';
import { api } from '../../services/api.js';
import { financeInput, financeButton, label } from './FinanceShared.jsx';
export default function FinanceAccess({ onClose }) {
  const [role, setRole] = useState(''),
    [permissions, setPermissions] = useState([]);
  const query = useQuery({
    queryKey: ['financeAccess'],
    queryFn: async () => (await api.get('/finance/access')).data.data,
  });
  const mutation = useMutation({
    mutationFn: () => api.patch(`/finance/access/${role}`, { permissions }),
  });
  return (
    <HRMSDialog
      open
      wide
      title="Finance Access"
      description="Configure finance permissions for existing roles. OWN is the default; broader scopes require explicit grants. Super Admin access cannot be removed."
      onOpenChange={() => onClose()}
    >
      {query.isPending && <p role="status">Loading permissions…</p>}
      {query.isError && <p role="alert">Unable to load permissions.</p>}
      {query.data && (
        <div className="space-y-4">
          <select
            aria-label="Finance role"
            className={financeInput}
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPermissions(
                query.data.items.find(
                  (item) => item.name === event.target.value,
                )?.permissions || [],
              );
              mutation.reset();
            }}
          >
            <option value="">Select role</option>
            {query.data.items
              .filter((item) => item.name !== 'super_admin')
              .map((item) => (
                <option key={item.name} value={item.name}>
                  {item.label}
                </option>
              ))}
          </select>
          {role && (
            <>
              <div className="grid max-h-96 gap-3 overflow-y-auto rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
                {query.data.permissions.map((permission) => (
                  <label key={permission} className="flex gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={permissions.includes(permission)}
                      onChange={(event) =>
                        setPermissions(
                          event.target.checked
                            ? [...permissions, permission]
                            : permissions.filter((item) => item !== permission),
                        )
                      }
                    />
                    {label(permission.replaceAll('.', ' · '))}
                  </label>
                ))}
              </div>
              <button
                className={financeButton}
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                Save finance access
              </button>
            </>
          )}
          {mutation.isSuccess && (
            <p role="status" className="text-xs text-green-700">
              Permissions updated; APIs enforce changes immediately. Refresh the
              user session to update navigation.
            </p>
          )}
          {mutation.isError && (
            <p role="alert">
              {mutation.error.response?.data?.error?.message ||
                'Unable to update access'}
            </p>
          )}
        </div>
      )}
    </HRMSDialog>
  );
}
