import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { Button } from '../../components/ui/Button.jsx';
import FollowUpForm from '../../components/crm/FollowUpForm.jsx';
import {
  Badge,
  can,
  date,
  Message,
  Pager,
  panel,
  QueryState,
  useCRMMutation,
  usePermissions,
} from '../../components/crm/CRMShared.jsx';
import { label } from '../../../../shared/crm.js';
export default function FollowUps({ leadId }) {
  const [tab, setTab] = useState('today');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState(null);
  const permissions = usePermissions();
  const query = useQuery({
    queryKey: ['followUps', leadId, tab, page],
    queryFn: async () =>
      (
        await api.get(
          leadId ? `/crm/leads/${leadId}/follow-ups` : '/crm/follow-ups',
          { params: { tab, page } },
        )
      ).data.data,
    refetchInterval: 60000,
  });
  const cancel = useCRMMutation(
    async (record) => (await api.delete(`/crm/follow-ups/${record._id}`)).data,
  );
  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-3">
        <h2 className="text-lg font-bold">Follow-ups</h2>
        {leadId && can(permissions, 'crm.followups.create') && (
          <Button onClick={() => setAction({ action: 'create' })}>
            Add Follow-up
          </Button>
        )}
        {!leadId && can(permissions, 'crm.followups.create') && (
          <Link to="/crm/leads" className="text-xs text-blue-700">
            Open a lead to schedule a follow-up →
          </Link>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {['today', 'overdue', 'upcoming', 'completedToday'].map((key) => (
          <div key={key} className={panel}>
            <p className="text-xs text-slate-500">
              {label(key.replace('Today', ' Today'))}
            </p>
            <strong className="mt-2 block text-2xl">
              {query.data?.summary[key] || 0}
            </strong>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {['today', 'upcoming', 'overdue', 'completed', 'all'].map((value) => (
          <Button
            key={value}
            variant={tab === value ? 'default' : 'secondary'}
            size="sm"
            onClick={() => {
              setTab(value);
              setPage(1);
            }}
          >
            {label(value)}
          </Button>
        ))}
      </div>
      <Message mutation={cancel} />
      <QueryState query={query}>
        <div className={panel}>
          <div className="space-y-3">
            {query.data?.items.map((record) => (
              <article
                key={record._id}
                className="rounded-xl border border-slate-100 p-4"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <Link
                      className="text-sm font-bold text-blue-700"
                      to={`/crm/leads/${record.lead._id}`}
                    >
                      {record.lead.companyName}
                    </Link>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {record.followUpId} · {label(record.type)} ·{' '}
                      {date(record.scheduledAt)} · {record.assignedTo?.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge value={record.status} />
                    <Badge value={record.priority} />
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-xs">
                  {record.notes}
                </p>
                {record.outcome && (
                  <p className="mt-2 text-xs text-emerald-700">
                    Outcome: {record.outcome}
                  </p>
                )}
                {record.status === 'PENDING' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {can(permissions, 'crm.followups.complete') && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setAction({ action: 'complete', record })
                        }
                      >
                        Complete
                      </Button>
                    )}
                    {can(permissions, 'crm.followups.edit') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setAction({ action: 'reschedule', record })
                        }
                      >
                        Reschedule
                      </Button>
                    )}
                    {can(permissions, 'crm.followups.delete') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={cancel.isPending}
                        onClick={() => cancel.mutate(record)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </article>
            ))}
            {!query.data?.items.length && (
              <p className="py-8 text-center text-sm text-slate-500">
                No follow-ups scheduled for {tab === 'all' ? 'this view' : tab}.
              </p>
            )}
          </div>
          <Pager
            pagination={query.data?.pagination}
            page={page}
            onPage={setPage}
          />
        </div>
      </QueryState>
      {action && (
        <FollowUpForm
          {...action}
          leadId={leadId}
          onClose={() => setAction(null)}
        />
      )}
    </div>
  );
}
