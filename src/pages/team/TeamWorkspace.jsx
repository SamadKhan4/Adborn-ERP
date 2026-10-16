import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UsersRound,
  ListChecks,
  Target,
  CircleAlert,
  CalendarCheck2,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { Button } from '../../components/ui/Button.jsx';
import {
  Badge,
  can,
  date,
  input,
  Message,
  panel,
  QueryState,
  usePermissions,
} from '../../components/crm/CRMShared.jsx';
import TeamBoard from '../../components/team/TeamBoard.jsx';
import {
  MemberForm,
  SprintForm,
  StandupForm,
  useTeamMutation,
} from '../../components/team/TeamForms.jsx';
const tabs = [
  'Overview',
  'Task Board',
  'Sprints',
  'Daily Stand-ups',
  'Blockers',
  'Team',
];
export default function TeamWorkspace() {
  const user = useAuthStore((state) => state.user);
  const permissions = usePermissions();
  const [selected, setSelected] = useState('');
  const [tab, setTab] = useState('Overview');
  const [dialog, setDialog] = useState(null);
  const allowed = user.role === 'team_leader' && can(permissions, 'team.workspace.view');
  const editable = can(permissions, 'team.workspace.manage');
  const oversight = can(permissions, 'team.members.manage');
  const leaders = useQuery({
    queryKey: ['teamLeaders'],
    queryFn: async () => (await api.get('/team/leaders')).data.data.items,
    enabled: allowed,
  });
  const leader =
    selected ||
    (user.role === 'team_leader' ? user.id : leaders.data?.[0]?._id);
  const query = useQuery({
    queryKey: ['teamWorkspace', leader],
    queryFn: async () =>
      (await api.get('/team/workspace', { params: { leader } })).data.data,
    enabled: allowed && Boolean(leader),
    refetchInterval: 15000,
  });
  const action = useTeamMutation(
    async ({ sprint, action: name }) =>
      (
        await api.post(
          `/team/sprints/${sprint._id}/action`,
          { action: name },
          { params: { leader } },
        )
      ).data,
  );
  const removeMember = useTeamMutation(
    async (employee) =>
      (
        await api.post(
          '/team/members',
          { employee, remove: true },
          { params: { leader } },
        )
      ).data,
  );
  if (!allowed)
    return (
      <p role="alert">
        You do not have permission to access the Team Leader workspace.
      </p>
    );
  const data = query.data;
  const count = (status) =>
    data?.summary.find((item) => item._id === status)?.count || 0;
  const total = data?.summary.reduce((sum, item) => sum + item.count, 0) || 0;
  const active = data?.sprints.find((item) => item.status === 'ACTIVE');
  const progress = (data?.sprintProgress || []).filter((row) => row._id.sprint === active?._id);
  const donePoints = progress.filter((row) => row._id.status === 'DONE').reduce((sum, row) => sum + row.points, 0);
  const plannedPoints = progress.reduce((sum, row) => sum + row.points, 0);
  return (
    <div className="space-y-5 text-[#173958]">
      <section className="rounded-3xl border border-[#dceaf5] bg-[#f0f8fd] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0987c4]">
              Team delivery workspace
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              Team Leader & Scrum Master
            </h1>
            <p className="mt-2 text-xs text-slate-600">
              Plan work, run sprints, unblock your team, and follow delivery.
            </p>
          </div>
          {oversight && (
            <label className="text-xs">
              Team Leader
              <select
                className={input}
                value={leader || ''}
                onChange={(event) => {
                  setSelected(event.target.value);
                  setDialog(null);
                }}
              >
                {leaders.data?.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} · {item.department}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>
      <QueryState query={leaders}>
        {!leader ? (
          <p className={panel}>
            No active Team Leaders yet. Create a Team Leader through employee
            onboarding.
          </p>
        ) : (
          <QueryState query={query}>
            {data && (
              <>
                <nav
                  aria-label="Team workspace navigation"
                  className="flex gap-1 overflow-x-auto rounded-2xl border bg-white p-2"
                >
                  {tabs.map((name) => (
                    <button
                      key={name}
                      className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold ${tab === name ? 'bg-[#e7f3fc] text-[#006eb5]' : 'text-slate-500 hover:bg-slate-50'}`}
                      onClick={() => setTab(name)}
                    >
                      {name}
                    </button>
                  ))}
                </nav>
                <Message mutation={action} />
                {tab === 'Overview' && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                      {[
                        [UsersRound, 'Team members', data.members.length],
                        [ListChecks, 'Open tasks', total - count('DONE')],
                        [Target, 'Done tasks', count('DONE')],
                        [CircleAlert, 'Blocked tasks', count('BLOCKED')],
                        [
                          CalendarCheck2,
                          'Overdue tasks',
                          data.summary.reduce(
                            (sum, item) => sum + item.overdue,
                            0,
                          ),
                        ],
                        [
                          MessageSquare,
                          'Stand-ups today',
                          data.standups.length,
                        ],
                      ].map(([Icon, title, value]) => (
                        <div key={title} className={panel}>
                          <Icon className="mb-3 text-[#0987c4]" size={20} />
                          <p className="text-[10px] text-slate-500">{title}</p>
                          <strong className="mt-2 block text-2xl">
                            {value}
                          </strong>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-5 xl:grid-cols-2">
                      <section className={panel}>
                        <h2 className="text-sm font-bold">Active sprint</h2>
                        {active ? (
                          <>
                            <h3 className="mt-4 text-lg font-bold">
                              {active.title}
                            </h3>
                            <p className="mt-2 text-xs">{active.goal}</p>
                            <p className="mt-3 text-xs text-slate-500">
                              {date(active.startDate)} – {date(active.endDate)}
                            </p>
                            <p className="mt-3 text-xs">
                              Committed at start: {active.committedPoints}{' '}
                              points
                            </p>
                            <p className="mt-3 text-xs">Current scope: {donePoints} / {plannedPoints} points done</p><div role="progressbar" aria-label="Active sprint progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={plannedPoints ? Math.round(donePoints / plannedPoints * 100) : 0} className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#0987c4]" style={{ width: `${plannedPoints ? donePoints / plannedPoints * 100 : 0}%` }} /></div>
                            <Button
                              className="mt-4"
                              size="sm"
                              variant="secondary"
                              onClick={() => setTab('Task Board')}
                            >
                              Open task board
                            </Button>
                          </>
                        ) : (
                          <p className="mt-5 text-xs text-slate-500">
                            No active sprint. Plan a sprint and add backlog
                            items before starting it.
                          </p>
                        )}
                      </section>
                      <section className={panel}>
                        <h2 className="mb-4 text-sm font-bold">
                          Team workload · open work
                        </h2>
                        {[data.leader, ...data.members].map((member) => {
                          const workload = data.workload.find(
                            (row) => row._id === member._id,
                          );
                          return (
                            <div
                              key={member._id}
                              className="flex justify-between border-t py-3 text-xs"
                            >
                              <strong>{member.name}</strong>
                              <span>
                                {workload?.tasks || 0} tasks ·{' '}
                                {workload?.points || 0} points ·{' '}
                                {workload?.blocked || 0} blocked
                              </span>
                            </div>
                          );
                        })}
                        <p className="mt-3 text-[10px] text-slate-500">
                          Unassigned:{' '}
                          {data.workload.find((row) => !row._id)?.tasks || 0}{' '}
                          open tasks
                        </p>
                      </section>
                    </div>
                    <section className={panel}>
                      <h2 className="mb-4 text-sm font-bold">
                        Recent team activity
                      </h2>
                      {data.activity.map((item) => (
                        <p key={item._id} className="border-t py-3 text-xs">
                          <strong>{item.user?.name}</strong> ·{' '}
                          {item.details?.title || item.action}{' '}
                          <span className="text-slate-500">
                            {date(item.createdAt)}
                          </span>
                        </p>
                      ))}
                      {!data.activity.length && (
                        <p className="text-xs text-slate-500">
                          No team activity yet.
                        </p>
                      )}
                    </section>
                  </>
                )}
                {['Task Board', 'Blockers'].includes(tab) && (
                  <TeamBoard
                    key={`${leader}:${tab}`}
                    leader={leader}
                    team={data}
                    editable={editable}
                    blockersOnly={tab === 'Blockers'}
                  />
                )}
                {tab === 'Sprints' && (
                  <section className={panel}>
                    <div className="flex justify-between">
                      <h2 className="text-lg font-bold">
                        Sprint planning & reviews
                      </h2>
                      {editable && (
                        <Button onClick={() => setDialog({ type: 'sprint' })}>
                          Plan Sprint
                        </Button>
                      )}
                    </div>
                    {data.sprints.map((sprint) => (
                      <article
                        key={sprint._id}
                        className="mt-4 rounded-xl border p-4"
                      >
                        <div className="flex flex-wrap justify-between gap-3">
                          <strong className="text-sm">{sprint.title}</strong>
                          <Badge value={sprint.status} />
                        </div>
                        <p className="mt-2 text-xs">{sprint.goal}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {date(sprint.startDate)} – {date(sprint.endDate)}
                        </p>
                        <p className="mt-2 text-xs">
                          Committed: {sprint.committedPoints} · Completed:{' '}
                          {sprint.completedPoints} points
                        </p>
                        {sprint.retrospective && (
                          <div className="mt-3 space-y-2 whitespace-pre-wrap text-xs">
                            <p>
                              <strong>Went well: </strong>
                              {sprint.retrospective.wentWell || 'No notes'}
                            </p>
                            <p>
                              <strong>Improve: </strong>
                              {sprint.retrospective.improve || 'No notes'}
                            </p>
                            <p>
                              <strong>Next actions: </strong>
                              {sprint.retrospective.actions || 'No notes'}
                            </p>
                          </div>
                        )}
                        {editable && sprint.status === 'PLANNED' && (
                          <Button
                            className="mt-3"
                            size="sm"
                            disabled={Boolean(active) || action.isPending}
                            onClick={() =>
                              action.mutate({ sprint, action: 'start' })
                            }
                          >
                            Start Sprint
                          </Button>
                        )}
                        {editable && sprint.status === 'ACTIVE' && (
                          <Button
                            className="mt-3"
                            size="sm"
                            onClick={() =>
                              setDialog({ type: 'sprint', sprint })
                            }
                          >
                            Complete & Review
                          </Button>
                        )}
                      </article>
                    ))}
                    {!data.sprints.length && (
                      <p className="mt-6 text-xs text-slate-500">
                        No sprints planned yet.
                      </p>
                    )}
                    <p className="mt-4 text-[10px] text-slate-500">
                      Latest 30 sprints.
                    </p>
                  </section>
                )}
                {tab === 'Daily Stand-ups' && (
                  <section className={panel}>
                    <div className="flex justify-between">
                      <h2 className="text-lg font-bold">
                        Daily stand-ups · {data.date}
                      </h2>
                      {leader === user.id && (
                        <Button onClick={() => setDialog({ type: 'standup' })}>
                          My Stand-up
                        </Button>
                      )}
                    </div>
                    {[data.leader, ...data.members].map((member) => {
                      const record = data.standups.find(
                        (item) => item.employee._id === member._id,
                      );
                      return (
                        <article
                          key={member._id}
                          className="mt-4 rounded-xl border p-4 text-xs"
                        >
                          <strong>{member.name}</strong>
                          {record ? (
                            <div className="mt-3 space-y-3 whitespace-pre-wrap">
                              <p>
                                <strong>Completed: </strong>
                                {record.yesterday || 'No update'}
                              </p>
                              <p>
                                <strong>Today: </strong>
                                {record.today}
                              </p>
                              <p
                                className={
                                  record.blockers
                                    ? 'text-rose-700'
                                    : 'text-emerald-700'
                                }
                              >
                                <strong>Blockers: </strong>
                                {record.blockers || 'None reported'}
                              </p>
                            </div>
                          ) : (
                            <p className="mt-3 text-amber-700">
                              Stand-up not submitted
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </section>
                )}
                {tab === 'Team' && (
                  <section className={panel}>
                    <div className="flex justify-between">
                      <h2 className="text-lg font-bold">Reporting team</h2>
                      {oversight && (
                        <Button onClick={() => setDialog({ type: 'member' })}>
                          Assign Member
                        </Button>
                      )}
                    </div>
                    <Message mutation={removeMember} />
                    {data.members.map((member) => {
                      const attendance = data.attendance.find(
                        (record) => record.employee === member._id,
                      );
                      const report = data.reports.find(
                        (record) => record.employee === member._id,
                      );
                      return (
                        <article
                          key={member._id}
                          className="mt-4 rounded-xl border p-4 text-xs"
                        >
                          <div className="flex flex-wrap justify-between gap-3">
                            <div>
                              <strong>{member.name}</strong>
                              <p className="mt-1 text-slate-500">
                                {member.email} · {member.department}
                              </p>
                            </div>
                            <span>
                              {attendance
                                ? attendance.data.checkOut
                                  ? 'Checked out'
                                  : 'Checked in'
                                : 'No check-in recorded'}
                            </span>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap">
                            Daily report:{' '}
                            {report?.data.summary || 'Not submitted today'}
                          </p>
                          {report?.data.blockers && (
                            <p className="mt-2 text-rose-700">
                              Report blocker: {report.data.blockers}
                            </p>
                          )}
                          {oversight && (
                            <Button
                              className="mt-3"
                              size="sm"
                              variant="secondary"
                              disabled={removeMember.isPending}
                              onClick={() => removeMember.mutate(member._id)}
                            >
                              Remove from team
                            </Button>
                          )}
                        </article>
                      );
                    })}
                    {!data.members.length && (
                      <p className="mt-5 text-xs text-slate-500">
                        No reporting members assigned. An admin or manager can
                        assign employees to this Team Leader.
                      </p>
                    )}
                  </section>
                )}
                {dialog?.type === 'sprint' && (
                  <SprintForm
                    leader={leader}
                    sprint={dialog.sprint}
                    onClose={() => setDialog(null)}
                  />
                )}
                {dialog?.type === 'standup' && (
                  <StandupForm
                    leader={leader}
                    standup={data.standups.find(
                      (item) => item.employee._id === user.id,
                    )}
                    onClose={() => setDialog(null)}
                  />
                )}
                {dialog?.type === 'member' && (
                  <MemberForm leader={leader} onClose={() => setDialog(null)} />
                )}
              </>
            )}
          </QueryState>
        )}
      </QueryState>
    </div>
  );
}
