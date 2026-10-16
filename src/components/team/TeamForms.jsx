import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import HRMSDialog from '../hrms/HRMSDialog.jsx';
import { Button } from '../ui/Button.jsx';
import {
  Field,
  input,
  Message,
  useDebounced,
  Pager,
} from '../crm/CRMShared.jsx';
import {
  taskStatuses,
  taskPriorities,
  teamLabel,
} from '../../../shared/team.js';
export function useTeamMutation(fn, onSuccess) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (data) => {
      await Promise.all(
        ['teamWorkspace', 'teamTasks', 'myWork', 'employee-dashboard', 'notifications'].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
      onSuccess?.(data);
    },
  });
}
export function TaskForm({ task, team, leader, onClose, self = false }) {
  const archive = useTeamMutation(
    async () =>
      (
        await api.delete(`/team/tasks/${task._id}`, {
          data: { version: task.version },
          params: { leader },
        })
      ).data,
    onClose,
  );
  const [status, setStatus] = useState(task?.status || 'TODO');
  const mutation = useTeamMutation(
    async (body) =>
      (
        await (task
          ? api.patch(
              self ? `/team/my-tasks/${task._id}` : `/team/tasks/${task._id}`,
              body,
              { params: { leader } },
            )
          : api.post('/team/tasks', body, { params: { leader } }))
      ).data,
    onClose,
  );
  const submit = (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const body = self
      ? { status, blocker: values.get('blocker') || '', version: task.version }
      : {
          title: values.get('title'),
          description: values.get('description'),
          assignedTo: values.get('assignedTo') || null,
          sprint: values.get('sprint') || null,
          status,
          priority: values.get('priority'),
          points: Number(values.get('points')),
          dueDate: values.get('dueDate')
            ? `${values.get('dueDate')}T23:59:59+05:30`
            : null,
          blocker: values.get('blocker') || '',
          acceptanceCriteria: values.get('acceptanceCriteria'),
          ...(task ? { version: task.version } : {}),
        };
    mutation.mutate(body);
  };
  return (
    <HRMSDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={task ? `${task.taskId} · Update task` : 'Create team task'}
      description="Define ownership, acceptance criteria, estimates and blockers."
    >
      <form className="space-y-4" onSubmit={submit}>
        {!self && (
          <>
            <Field label="Task title">
              <input
                className={input}
                name="title"
                required
                maxLength={180}
                defaultValue={task?.title || ''}
              />
            </Field>
            <Field label="Description">
              <textarea
                className={input}
                name="description"
                maxLength={4000}
                defaultValue={task?.description || ''}
              />
            </Field>
            <Field label="Assigned member">
              <select
                className={input}
                name="assignedTo"
                defaultValue={task?.assignedTo?._id || task?.assignedTo || ''}
              >
                <option value="">Unassigned</option>
                {[team.leader, ...team.members].map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sprint">
              <select
                className={input}
                name="sprint"
                defaultValue={task?.sprint?._id || task?.sprint || ''}
              >
                <option value="">Product backlog</option>
                {team.sprints
                  .filter((sprint) => sprint.status !== 'COMPLETED')
                  .map((sprint) => (
                    <option key={sprint._id} value={sprint._id}>
                      {sprint.title} ({sprint.status})
                    </option>
                  ))}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Priority">
                <select
                  className={input}
                  name="priority"
                  defaultValue={task?.priority || 'MEDIUM'}
                >
                  {taskPriorities.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <Field label="Story points">
                <input
                  type="number"
                  name="points"
                  className={input}
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={task?.points || 0}
                />
              </Field>
              <Field label="Due date">
                <input
                  type="date"
                  name="dueDate"
                  className={input}
                  defaultValue={task?.dueDate?.slice(0, 10) || ''}
                />
              </Field>
            </div>
            <Field label="Acceptance criteria">
              <textarea
                className={input}
                name="acceptanceCriteria"
                maxLength={3000}
                defaultValue={task?.acceptanceCriteria || ''}
              />
            </Field>
          </>
        )}
        <Field label="Task status">
          <select
            className={input}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {taskStatuses.map((value) => (
              <option key={value} value={value}>
                {teamLabel(value)}
              </option>
            ))}
          </select>
        </Field>
        {status === 'BLOCKED' && (
          <Field label="Blocker / help needed">
            <textarea
              className={input}
              name="blocker"
              required
              maxLength={2000}
              defaultValue={task?.blocker || ''}
            />
          </Field>
        )}
        <Message mutation={mutation} />
        <Button disabled={mutation.isPending}>Save task</Button>
        {task && !self && <><Message mutation={archive} /><Button className="ml-3" type="button" variant="secondary" disabled={archive.isPending} onClick={() => archive.mutate()}>Archive task</Button></>}
      </form>
    </HRMSDialog>
  );
}
export function SprintForm({ sprint, leader, onClose }) {
  const mutation = useTeamMutation(
    async (body) =>
      (
        await api.post(
          sprint ? `/team/sprints/${sprint._id}/action` : '/team/sprints',
          body,
          { params: { leader } },
        )
      ).data,
    onClose,
  );
  return (
    <HRMSDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={sprint ? 'Complete sprint & retrospective' : 'Plan a sprint'}
      description={
        sprint
          ? 'Done work remains in sprint history. Unfinished work returns to the product backlog.'
          : 'Set a clear goal and timebox for your team.'
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const values = Object.fromEntries(new FormData(event.currentTarget));
          mutation.mutate(sprint ? { action: 'complete', ...values } : values);
        }}
      >
        {sprint ? (
          ['wentWell', 'improve', 'actions'].map((key) => (
            <Field
              key={key}
              label={
                {
                  wentWell: 'What went well?',
                  improve: 'What should improve?',
                  actions: 'Agreed next actions',
                }[key]
              }
            >
              <textarea className={input} name={key} maxLength={3000} />
            </Field>
          ))
        ) : (
          <>
            <Field label="Sprint name">
              <input className={input} name="title" required maxLength={120} />
            </Field>
            <Field label="Sprint goal">
              <textarea className={input} name="goal" maxLength={2000} />
            </Field>
            <Field label="Start date">
              <input className={input} name="startDate" type="date" required />
            </Field>
            <Field label="End date">
              <input className={input} name="endDate" type="date" required />
            </Field>
          </>
        )}
        <Message mutation={mutation} />
        <Button disabled={mutation.isPending}>
          {sprint ? 'Complete sprint' : 'Plan sprint'}
        </Button>
      </form>
    </HRMSDialog>
  );
}
export function StandupForm({ leader, standup, onClose }) {
  const mutation = useTeamMutation(
    async (body) =>
      (await api.post('/team/standups', { leader, ...body })).data,
    onClose,
  );
  return (
    <HRMSDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Daily stand-up"
      description="Share progress, today’s plan, and anything blocking your work."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(
            Object.fromEntries(new FormData(event.currentTarget)),
          );
        }}
      >
        {[
          ['yesterday', 'Completed since last update'],
          ['today', 'Plan for today'],
          ['blockers', 'Blockers / support needed'],
        ].map(([key, title]) => (
          <Field key={key} label={title}>
            <textarea
              className={input}
              name={key}
              required={key === 'today'}
              maxLength={key === 'blockers' ? 2000 : 3000}
              defaultValue={standup?.[key] || ''}
            />
          </Field>
        ))}
        <Message mutation={mutation} />
        <Button disabled={mutation.isPending}>Save stand-up</Button>
      </form>
    </HRMSDialog>
  );
}
export function MemberForm({ leader, onClose }) {
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [page, setPage] = useState(1);
  const [employee, setEmployee] = useState('');
  const query = useQuery({
    queryKey: ['teamMemberOptions', debounced, page],
    queryFn: async () =>
      (
        await api.get('/team/member-options', {
          params: { search: debounced, page },
        })
      ).data.data,
  });
  const mutation = useTeamMutation(
    async () =>
      (await api.post('/team/members', { employee }, { params: { leader } }))
        .data,
    onClose,
  );
  return (
    <HRMSDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Assign reporting member"
      description="This sets the employee’s reporting manager. When transferring, open tasks in the previous team become unassigned."
    >
      <input
        className={input}
        aria-label="Search team employees"
        placeholder="Search employee name"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
      />
      <select
        className={input}
        aria-label="Reporting employee"
        value={employee}
        onChange={(event) => setEmployee(event.target.value)}
      >
        <option value="">Choose employee</option>
        {query.data?.items.map((member) => (
          <option key={member._id} value={member._id}>
            {member.name} · {member.department}
          </option>
        ))}
      </select>
      {query.isError && <p role="alert">Unable to load employees</p>}
      <Pager page={page} pagination={query.data?.pagination} onPage={setPage} />
      <Message mutation={mutation} />
      <Button
        className="mt-4"
        disabled={!employee || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Assign to team
      </Button>
    </HRMSDialog>
  );
}
