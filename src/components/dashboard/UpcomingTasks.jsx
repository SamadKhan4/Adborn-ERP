import { tw } from '../../lib/tailwind.js';
import { Link } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
import { tasks } from '../../data/dashboardDemo.js';
export default function UpcomingTasks() {
  return (
    <SectionCard
      title="Upcoming Tasks"
      icon={CircleCheck}
      actions={<Link to="/tasks">View all</Link>}
    >
      <ul className={tw('task-list')}>
        {tasks.map((task) => (
          <li key={task.title}>
            <input
              type="checkbox"
              disabled
              aria-label={`${task.title} — demo task, editing unavailable`}
            />
            <div>
              <strong>{task.title}</strong>
              <p>{task.department}</p>
            </div>
            <span className={tw(`due-badge ${task.due.toLowerCase()}`)}>
              {task.due}
            </span>
            <span className={tw('task-avatar')}>{task.initials}</span>
          </li>
        ))}
      </ul>
      <p className={tw('demo-note')}>Demo tasks · Completion is unavailable</p>
    </SectionCard>
  );
}
