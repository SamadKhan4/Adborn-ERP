import { tw } from '../../lib/tailwind.js';
import {
  Zap,
  Folder,
  CircleDollarSign,
  UserRound,
  UsersRound,
  Check,
} from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
const iconFor = (action) =>
  action.includes('invoice') || action.includes('payment')
    ? [CircleDollarSign, 'payment']
    : action.includes('project')
      ? [Folder, 'project']
      : action.includes('leave') || action.includes('employee')
        ? [UserRound, 'leave']
        : action.includes('client') || action.includes('lead')
          ? [UsersRound, 'client']
          : [Check, 'task'];
export default function ActivityFeed({ activities = [] }) {
  return (
    <SectionCard title="Recent Activity" icon={Zap}>
      <ul className={tw('activity-list')}>
        {activities.slice(0, 5).map((item) => {
          const [Icon, kind] = iconFor(item.action);
          return (
            <li key={item._id}>
              <span className={tw(`activity-icon ${kind}`)}>
                <Icon size={18} />
              </span>
              <div>
                <strong>{item.action.replaceAll(/[._]/g, ' ')}</strong>
                <p>{item.user?.name || 'System'}</p>
              </div>
              <time dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </li>
          );
        })}
      </ul>
      {!activities.length && (
        <p className={tw('empty-state')}>No activity recorded yet.</p>
      )}
    </SectionCard>
  );
}
