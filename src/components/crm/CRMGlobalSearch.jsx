import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { can, input, useDebounced, usePermissions } from './CRMShared.jsx';
export default function CRMGlobalSearch({ onNavigate }) {
  const permissions = usePermissions();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const allowed = [
    'crm.leads.view',
    'crm.leads.view_team',
    'crm.leads.view_own',
  ].some((permission) => can(permissions, permission));
  const query = useQuery({
    queryKey: ['crmSearch', debounced],
    queryFn: async ({ signal }) =>
      (
        await api.get('/crm/leads', {
          params: { search: debounced, limit: 8 },
          signal,
        })
      ).data.data.items,
    enabled: allowed && debounced.length >= 2,
  });
  return (
    <div>
      <h3>Search ERP</h3>
      {allowed ? (
        <>
          <input
            autoFocus
            className={input}
            aria-label="Global lead search"
            placeholder="Search leads by name, phone, email or ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">
            Leads
          </p>
          {debounced.length < 2 ? (
            <p className="mt-3 text-xs">Enter at least two characters.</p>
          ) : query.isPending ? (
            <p role="status">Searching…</p>
          ) : query.isError ? (
            <p role="alert">Unable to search leads.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {query.data?.map((lead) => (
                <Link
                  key={lead._id}
                  className="mt-2 block rounded-lg border p-3 text-xs"
                  to={`/crm/leads/${lead._id}`}
                  onClick={onNavigate}
                >
                  <strong>{lead.leadId}</strong>
                  <p>{lead.companyName}</p>
                  <small>{lead.contactPerson}</small>
                </Link>
              ))}
              {!query.data?.length && (
                <p className="mt-3 text-xs">No leads found.</p>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs">
          No searchable CRM records are available for your permissions.
        </p>
      )}
    </div>
  );
}
