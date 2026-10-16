import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { Button } from '../ui/Button.jsx';
import {
  Badge,
  input,
  Message,
  Pager,
  panel,
  QueryState,
  useDebounced,
} from '../crm/CRMShared.jsx';
import { taskStatuses, teamLabel } from '../../../../shared/team.js';
import { TaskForm, useTeamMutation } from './TeamForms.jsx';
export default function TeamBoard({
  team,
  leader,
  editable,
  blockersOnly = false,
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [sprint, setSprint] = useState('');
  const [owner, setOwner] = useState('');
  const [editor, setEditor] = useState(null);
  const [dragged, setDragged] = useState(null);
  const params = {
    leader,
    page,
    search: debounced,
    ...(sprint ? { sprint } : {}),
    ...(owner ? { assignedTo: owner } : {}),
    ...(blockersOnly ? { status: 'BLOCKED' } : {}),
  };
  const query = useQuery({
    refetchInterval: 15000,
    queryKey: ['teamTasks', params],
    queryFn: async () => (await api.get('/team/tasks', { params })).data.data,
  });
  const mutation = useTeamMutation(
    async ({ task, status }) =>
      (
        await api.patch(
          `/team/tasks/${task._id}`,
          { status, blocker: '', version: task.version },
          { params: { leader } },
        )
      ).data,
  );
  const drop = (status) => {
    if (!dragged || !editable || dragged.status === status) return;
    if (status === 'BLOCKED') setEditor({ ...dragged, status });
    else mutation.mutate({ task: dragged, status });
    setDragged(null);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          {blockersOnly ? 'Impediments & blockers' : 'Team task board'}
        </h2>
        {editable && <Button onClick={() => setEditor({})}>Create Task</Button>}
      </div>
      <div className={`${panel} grid gap-3 sm:grid-cols-3`}>
        <input
          aria-label="Search team tasks"
          className={input}
          value={search}
          placeholder="Search tasks"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Filter sprint"
          className={input}
          value={sprint}
          onChange={(event) => {
            setSprint(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All sprints</option>
          <option value="backlog">Product backlog</option>
          {team.sprints.map((item) => (
            <option key={item._id} value={item._id}>
              {item.title}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter assignee"
          className={input}
          value={owner}
          onChange={(event) => {
            setOwner(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All members</option>
          {[team.leader, ...team.members].map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <Message mutation={mutation} />
      <QueryState query={query}>
        <div className="flex items-start gap-3 overflow-x-auto pb-3">
          {(blockersOnly ? ['BLOCKED'] : taskStatuses).map((status) => (
            <section
              key={status}
              onDragOver={(event) => editable && event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                drop(status);
              }}
              className="w-72 shrink-0 rounded-2xl border border-slate-200 bg-[#f4f8fc] p-3"
            >
              <h3 className="mb-3 text-xs font-bold">{teamLabel(status)}</h3>
              <div className="space-y-3">
                {query.data?.items
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <article
                      key={task._id}
                      draggable={
                        editable && task.sprint?.status !== 'COMPLETED'
                      }
                      onDragStart={() => setDragged(task)}
                      className="rounded-xl border bg-white p-4 shadow-sm"
                    >
                      <p className="text-[10px] text-slate-500">
                        {task.taskId}
                      </p>
                      <h4 className="mt-2 text-sm font-bold">{task.title}</h4>
                      <p className="mt-2 text-xs text-slate-600">
                        {task.assignedTo?.name || 'Unassigned'} · {task.points}{' '}
                        points
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {task.sprint?.title || 'Product backlog'}
                        {task.dueDate && ` · Due ${task.dueDate.slice(0, 10)}`}
                      </p>
                      {task.blocker && (
                        <p className="mt-3 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                          {task.blocker}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <Badge value={task.priority} />
                        <button
                          className="text-xs font-semibold text-blue-700"
                          onClick={() => setEditor(task)}
                        >
                          {editable && task.sprint?.status !== 'COMPLETED'
                            ? 'Open / Edit'
                            : 'View'}
                        </button>
                      </div>
                    </article>
                  ))}
                {!query.data?.items.some((task) => task.status === status) && (
                  <p className="py-8 text-center text-xs text-slate-500">
                    No tasks on this page
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
        <Pager
          page={page}
          pagination={query.data?.pagination}
          onPage={setPage}
        />
      </QueryState>
      {editor &&
        (editable && editor.sprint?.status !== 'COMPLETED' ? (
          <TaskForm
            task={editor._id ? editor : null}
            team={team}
            leader={leader}
            onClose={() => setEditor(null)}
          />
        ) : (
          <div className={panel}>
            <h3 className="font-bold">{editor.title}</h3>
            <p className="my-3 whitespace-pre-wrap text-xs">
              {editor.description}
            </p>
            <p className="whitespace-pre-wrap text-xs">
              Acceptance criteria:{' '}
              {editor.acceptanceCriteria || 'Not specified'}
            </p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => setEditor(null)}
            >
              Close details
            </Button>
          </div>
        ))}
    </div>
  );
}
