import { tw } from '../../lib/tailwind.js';
import { Zap } from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
export default function ActivityFeed({ activities = [] }) {
  return (
    <SectionCard
      title="Recent Activity"
      subtitle="Latest system events"
      icon={Zap}
    >
      <ul className={tw('activity-list')}>
        {activities.map((item) => (
          <li key={item._id}>
            <span className={tw('activity-icon')}>
              <Zap size={18} />
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
        ))}
      </ul>
      {!activities.length && (
        <p className={tw('empty-state')}>No activity recorded yet.</p>
      )}
    </SectionCard>
  );
}
