import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { Badge, date, Pager, panel, QueryState } from './CRMShared.jsx';
export default function ActivityTimeline({ leadId, notesOnly = false }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['leadActivities', leadId, page, notesOnly],
    queryFn: async () =>
      (
        await api.get(
          leadId ? `/crm/leads/${leadId}/activities` : '/crm/activities',
          {
            params: { page, limit: 25, ...(notesOnly ? { type: 'NOTE' } : {}) },
          },
        )
      ).data.data,
  });
  const items =
    query.data?.items.filter((item) => !notesOnly || item.type === 'NOTE') ||
    [];
  return (
    <QueryState query={query}>
      <section className={panel}>
        <h2 className="mb-4 text-sm font-bold">
          {notesOnly ? 'Notes in activity history' : 'Activity timeline'}
        </h2>
        {items.map((item) => (
          <article
            key={item._id}
            className="relative border-l-2 border-sky-100 pb-6 pl-5"
          >
            <span className="absolute -left-[5px] top-1 size-2 rounded-full bg-sky-500" />
            <div className="flex flex-wrap justify-between gap-2">
              <strong className="text-xs">{item.title}</strong>
              <Badge value={item.type} />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              {date(item.createdAt)} · {item.actor?.name || 'ERP user'}
            </p>
            {!leadId && (
              <Link
                className="text-xs text-blue-700"
                to={`/crm/leads/${item.lead._id}`}
              >
                {item.lead.leadId} · {item.lead.companyName}
              </Link>
            )}
            <p className="mt-2 whitespace-pre-wrap break-words text-xs">
              {item.description}
            </p>
            {item.metadata?.scheduledAt && (
              <p className="mt-2 text-xs">
                Scheduled: {date(item.metadata.scheduledAt)}
              </p>
            )}
            {item.metadata?.before &&
              typeof item.metadata.before === 'string' && (
                <p className="mt-2 text-xs">
                  {item.metadata.before} → {item.metadata.after}
                </p>
              )}
          </article>
        ))}
        {!items.length && (
          <p className="text-xs text-slate-500">
            No activities found on this page.
          </p>
        )}
        <Pager
          page={page}
          pagination={query.data?.pagination}
          onPage={setPage}
        />
      </section>
    </QueryState>
  );
}
