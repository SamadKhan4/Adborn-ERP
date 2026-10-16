import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { Button } from '../../components/ui/Button.jsx';
import { StageDialog } from '../../components/crm/LeadActions.jsx';
import {
  Badge,
  can,
  date,
  Message,
  money,
  QueryState,
  useCRMMutation,
  useMetadata,
  usePermissions,
} from '../../components/crm/CRMShared.jsx';
import { label } from '../../../shared/crm.js';
function Column({
  stage,
  title,
  summary,
  onDrag,
  onDrop,
  onChange,
  canManage,
}) {
  const [page, setPage] = useState(1);
  const [now] = useState(() => Date.now());
  const query = useQuery({
    queryKey: ['pipeline', stage, page],
    queryFn: async () =>
      (await api.get('/crm/leads', { params: { stage, page, limit: 20 } })).data
        .data,
  });
  return (
    <section
      onDragOver={(event) => {
        if (canManage) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (canManage) onDrop(stage);
      }}
      className="w-72 shrink-0 rounded-2xl border border-[#e5edf6] bg-[#f4f8fc] p-3"
    >
      <div className="mb-4">
        <h3 className="text-xs font-bold">
          {title}{' '}
          <span className="text-slate-500">
            ({summary.reduce((sum, item) => sum + item.count, 0)})
          </span>
        </h3>
        <p className="mt-1 text-[10px] text-slate-500">
          {summary
            .map((item) => money(item.value, item._id.currency))
            .join(' · ') || 'No pipeline value'}
        </p>
      </div>
      <QueryState query={query}>
        <div className="space-y-3">
          {query.data?.items.map((lead) => (
            <article
              key={lead._id}
              draggable={canManage}
              onDragStart={() => onDrag(lead)}
              className={`rounded-xl border border-[#e5edf6] bg-white p-4 shadow-sm ${canManage ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              <Link
                className="text-sm font-bold text-[#006eb5]"
                to={`/crm/leads/${lead._id}`}
              >
                {lead.companyName}
              </Link>
              <p className="mt-1 text-[11px] text-slate-500">
                {lead.contactPerson || lead.leadId}
              </p>
              <strong className="mt-3 block text-sm">
                {money(lead.estimatedBudget, lead.currency)}
              </strong>
              <p className="mt-2 text-[10px]">
                {lead.interestedServices.map(label).join(', ') ||
                  'No services selected'}
              </p>
              <p className="mt-2 text-[10px] text-slate-500">
                {lead.assignedTo?.name || 'Unassigned'} ·{' '}
                {Math.max(
                  0,
                  Math.floor((now - new Date(lead.createdAt)) / 86400000),
                )}{' '}
                days old
              </p>
              <p className="mt-2 text-[10px]">
                Follow-up: {date(lead.nextFollowUpAt)}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Badge value={lead.priority} />
                {canManage && (
                  <button
                    className="text-[10px] font-semibold text-blue-700"
                    onClick={() => onChange(lead)}
                  >
                    Move
                  </button>
                )}
              </div>
            </article>
          ))}
          {!query.data?.items.length && (
            <p className="py-8 text-center text-xs text-slate-500">No leads</p>
          )}
        </div>
        <div className="mt-4 flex justify-between">
          <Button
            size="sm"
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= (query.data?.pagination.totalPages || 1)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </QueryState>
    </section>
  );
}
export default function Pipeline() {
  const metadata = useMetadata();
  const permissions = usePermissions();
  const allowed =
    can(permissions, 'crm.pipeline.manage') ||
    can(permissions, 'crm.leads.change_stage');
  const [dragged, setDragged] = useState(null);
  const [dialog, setDialog] = useState(null);
  const query = useQuery({
    queryKey: ['pipeline', 'summary'],
    queryFn: async () => (await api.get('/crm/pipeline')).data.data,
  });
  const mutation = useCRMMutation(
    async ({ lead, stage }) =>
      (await api.post(`/crm/leads/${lead._id}/change-stage`, { stage })).data,
  );
  const drop = (stage) => {
    const lead = dragged;
    setDragged(null);
    if (!lead || lead.stage === stage || mutation.isPending) return;
    if (['LOST', 'WON'].includes(stage)) setDialog({ lead, stage });
    else mutation.mutate({ lead, stage });
  };
  if (!can(permissions, 'crm.pipeline.view'))
    return <p role="alert">You do not have permission to view the pipeline.</p>;
  return (
    <div>
      <h2 className="text-lg font-bold">Sales pipeline</h2>
      <p className="my-2 text-xs text-slate-500">
        Drag a card or use Move to change its stage. Changes appear after the
        server confirms them.
      </p>
      <Message mutation={mutation} />
      <QueryState query={query}>
        <div className="mt-5 flex items-start gap-4 overflow-x-auto pb-5">
          {metadata.data?.stages.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              title={metadata.data.stageLabels[stage] || label(stage)}
              summary={
                query.data?.stages.filter((item) => item._id.stage === stage) ||
                []
              }
              canManage={allowed}
              onDrag={setDragged}
              onDrop={drop}
              onChange={(lead) => setDialog({ lead })}
            />
          ))}
        </div>
      </QueryState>
      {dialog && <StageDialog {...dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}
