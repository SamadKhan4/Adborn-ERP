import { tw } from '../../lib/tailwind.js';
import { Link } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
export default function UpcomingTasks({ tasks = [] }) {
  return (
    <SectionCard
      title="Open Team Tasks"
      subtitle="Nearest deadlines first"
      icon={CircleCheck}
      actions={<Link to="/hrms/employees">Monitor employees</Link>}
    >
      <ul className={tw('task-list')}>
        {tasks.map((task) => (
          <li key={task._id}>
            <CircleCheck size={18} />
            <div>
              <strong>{task.title}</strong>
              <p>
                {task.assignedTo?.name || 'Unassigned'} /{' '}
                {task.status.replaceAll('_', ' ')}
              </p>
            </div>
            <span className={tw('due-badge')}>
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                  })
                : 'No deadline'}
            </span>
            <span className={tw('task-avatar')}>
              {task.assignedTo?.name?.slice(0, 2).toUpperCase() || '-'}
            </span>
          </li>
        ))}
      </ul>
      {!tasks.length && (
        <p className={tw('empty-state')}>No open team tasks.</p>
      )}
    </SectionCard>
  );
}
