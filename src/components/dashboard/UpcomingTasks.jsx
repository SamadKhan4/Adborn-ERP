import { indiaDate } from '../../lib/dashboardFormat.js';
import { tw } from '../../lib/tailwind.js';
import { Link } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
const dueLabel = (date) => {
  if (!date) return { label: 'No deadline', kind: '' };
  const today = new Date(`${indiaDate()}T00:00:00+05:30`);
  const value = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date(date));
  const days = Math.round(
    (new Date(`${value}T00:00:00+05:30`) - today) / 86400000,
  );
  return {
    label:
      days === 0
        ? 'Today'
        : days === 1
          ? 'Tomorrow'
          : new Date(date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              timeZone: 'Asia/Kolkata',
            }),
    kind: days === 0 ? 'today' : days === 1 ? 'tomorrow' : '',
  };
};
export default function UpcomingTasks({ tasks = [] }) {
  return (
    <SectionCard
      title="Upcoming Tasks"
      subtitle="Nearest deadlines first"
      icon={CircleCheck}
      actions={<Link to="/hrms/employees">Monitor employees</Link>}
    >
      <ul className={tw('task-list')}>
        {tasks.slice(0, 5).map((task) => {
          const due = dueLabel(task.dueDate);
          return (
            <li key={task._id}>
              <span className="reference-task-check" aria-hidden="true" />
              <div>
                <strong>{task.title}</strong>
                <p>
                  {task.assignedTo?.name || 'Unassigned'} /{' '}
                  {task.status.replaceAll('_', ' ')}
                </p>
              </div>
              <span className={tw(`due-badge ${due.kind}`)}>{due.label}</span>
              <span className={tw('task-avatar')}>
                {task.assignedTo?.name?.slice(0, 2).toUpperCase() || '-'}
              </span>
            </li>
          );
        })}
      </ul>
      {!tasks.length && (
        <p className={tw('empty-state')}>No open team tasks.</p>
      )}
    </SectionCard>
  );
}
