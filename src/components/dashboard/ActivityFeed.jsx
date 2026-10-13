import { tw } from '../../lib/tailwind.js';
import { Link } from 'react-router-dom';
import {
  Zap,
  Folder,
  CircleDollarSign,
  UserRound,
  UsersRound,
  Check,
} from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
import { activities } from '../../data/dashboardDemo.js';
const icons = {
  project: Folder,
  payment: CircleDollarSign,
  leave: UserRound,
  client: UsersRound,
  task: Check,
};
export default function ActivityFeed() {
  return (
    <SectionCard
      title="Recent Activity"
      icon={Zap}
      actions={<Link to="/activity">View all</Link>}
    >
      <ul className={tw('activity-list')}>
        {activities.map((activity) => {
          const Icon = icons[activity.icon];
          return (
            <li key={activity.title}>
              <span className={tw(`activity-icon ${activity.icon}`)}>
                <Icon size={19} />
              </span>
              <div>
                <strong>{activity.title}</strong>
                <p>{activity.detail}</p>
              </div>
              <time>{activity.time}</time>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
