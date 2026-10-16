import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { Button } from '../../components/ui/Button.jsx';
import {
  Badge,
  can,
  input,
  Pager,
  panel,
  QueryState,
  usePermissions,
} from '../../components/crm/CRMShared.jsx';
import { TaskForm, StandupForm } from '../../components/team/TeamForms.jsx';
export default function MyWork({ embedded = false, compact = false }) {
  const permissions = usePermissions();
  const [task, setTask] = useState(null);
  const [standup, setStandup] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState('open');
  const allowed = can(permissions, 'team.tasks.self');
  const limit = compact ? 6 : 25;
  const query = useQuery({
    queryKey: ['myWork', page, view, limit],
    queryFn: async () => (await api.get('/team/my-work', { params: { page, view, limit } })).data.data,
    enabled: allowed,
    refetchInterval: 15000,
  });
  if (!allowed)
    return embedded ? null : <p role="alert">You do not have access to this workspace.</p>;
  const data = query.data;
  return (
    <div className="space-y-5">
      {embedded ? <h2 className="text-lg font-bold text-[#173958]">Assigned Team Tasks</h2> : <h1 className="text-2xl font-bold text-[#173958]">My Team Work</h1>}
      <QueryState query={query}>
        {data && (
          <>
            <section className={panel}>
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold">
                    Reporting to:{' '}
                    {data.leader?.name || 'No Team Leader assigned'}
                  </h2>
                  <p className="mt-2 text-xs text-slate-500">
                    {data.date} ·{' '}
                    {data.standup
                      ? 'Daily stand-up submitted'
                      : 'Daily stand-up pending'}
                  </p>
                </div>
                {data.leader && (
                  <Button onClick={() => setStandup(true)}>
                    {data.standup ? 'Edit Stand-up' : 'Submit Stand-up'}
                  </Button>
                )}
              </div>
              {!data.leader && (
                <p className="mt-4 text-xs text-slate-500">
                  Ask your admin or manager to assign your reporting Team
                  Leader.
                </p>
              )}
            </section>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Open', (data.summary || []).filter((row) => row._id !== 'DONE').reduce((sum, row) => sum + row.count, 0)], ['In Progress', data.summary?.find((row) => row._id === 'IN_PROGRESS')?.count || 0], ['Blocked', data.summary?.find((row) => row._id === 'BLOCKED')?.count || 0], ['Completed', data.summary?.find((row) => row._id === 'DONE')?.count || 0]].map(([title, count]) => <div key={title} className={panel}><p className="text-xs text-slate-500">{title}</p><strong className="mt-2 block text-xl text-[#006eb5]">{count}</strong></div>)}</div>
            <select aria-label="My task view" className={input} value={view} onChange={(event) => { setView(event.target.value); setPage(1); }}><option value="open">Open tasks</option><option value="done">Completed tasks</option><option value="all">All tasks</option></select>
            <div className="grid gap-4 lg:grid-cols-2">
              {data.tasks.map((item) => (
                <article key={item._id} className={panel}>
                  <div className="flex justify-between gap-3">
                    <p className="text-[10px] text-slate-500">{item.taskId}</p>
                    <Badge value={item.status} />
                  </div>
                  <h2 className="mt-3 text-lg font-bold">{item.title}</h2>
                  <p className="mt-3 whitespace-pre-wrap text-xs">
                    {item.description}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-xs">
                    <strong>Acceptance criteria: </strong>
                    {item.acceptanceCriteria || 'Not specified'}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    {item.points} points ·{' '}
                    {item.sprint?.title || 'Product backlog'} · Due:{' '}
                    {item.dueDate?.slice(0, 10) || 'Not set'}
                  </p>
                  {item.blocker && (
                    <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                      {item.blocker}
                    </p>
                  )}
                  {item.sprint?.status !== 'COMPLETED' && (
                    <Button
                      className="mt-4"
                      size="sm"
                      onClick={() => setTask(item)}
                    >
                      Update progress / blocker
                    </Button>
                  )}
                </article>
              ))}
            </div>
            {!data.tasks.length && (
              <p className={panel}>No tasks assigned yet.</p>
            )}
            <Pager page={page} pagination={data.pagination} onPage={setPage} />
            {task && (
              <TaskForm task={task} self onClose={() => setTask(null)} />
            )}
            {standup && (
              <StandupForm
                leader={data.leader._id}
                standup={data.standup}
                onClose={() => setStandup(false)}
              />
            )}
          </>
        )}
      </QueryState>
    </div>
  );
}
