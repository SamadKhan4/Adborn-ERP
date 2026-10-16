import { Link } from 'react-router-dom';
import { UsersRound } from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
export default function ClientOverview({ clients = 0, leads = {} }) {
  const total = Object.values(leads).reduce((sum, value) => sum + value, 0);
  return (
    <SectionCard
      title="CRM Snapshot"
      icon={UsersRound}
      actions={<Link to="/crm">Open CRM</Link>}
    >
      <div className="grid grid-cols-2 gap-4 p-5">
        <div>
          <strong className="text-3xl font-bold text-sky-700">{clients}</strong>
          <p className="text-xs text-slate-500">Converted clients</p>
        </div>
        <div>
          <strong className="text-3xl font-bold">{total}</strong>
          <p className="text-xs text-slate-500">Total leads</p>
        </div>
      </div>
      <ul className="space-y-3 px-5 pb-5">
        {Object.entries(leads).map(([stage, count]) => (
          <li key={stage}>
            <div className="flex justify-between text-xs">
              <span>{stage.replaceAll('_', ' ')}</span>
              <strong>{count}</strong>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-sky-500"
                style={{ width: `${total ? (count / total) * 100 : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      {!total && (
        <p className="px-5 pb-5 text-xs text-slate-500">
          No leads recorded yet.
        </p>
      )}
    </SectionCard>
  );
}
