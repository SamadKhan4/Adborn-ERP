import { Link } from 'react-router-dom';
import { UsersRound } from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
export default function ClientOverview({ clients = 0, leads = {} }) {
  const stages = Object.entries(leads).sort((a, b) => b[1] - a[1]);
  const total = stages.reduce((sum, [, count]) => sum + count, 0);
  const rows = stages.slice(0, 3);
  if (stages.length > 3)
    rows.push([
      'OTHER STAGES',
      stages.slice(3).reduce((sum, [, count]) => sum + count, 0),
    ]);
  return (
    <SectionCard
      title="Client Overview"
      icon={UsersRound}
      actions={<Link to="/crm">Open CRM</Link>}
    >
      <div className="reference-client-summary">
        <div>
          <strong>{clients}</strong>
          <p>Total Clients</p>
          <small>{total} leads in CRM</small>
        </div>
        <div
          className={`reference-client-ring ${clients ? '' : 'empty'}`}
          role="img"
          aria-label={`${clients} total clients`}
        >
          <span>
            <strong>{clients}</strong>
            <small>Clients</small>
          </span>
        </div>
      </div>
      <p className="reference-pipeline-label">Lead pipeline</p>
      <ul className="reference-client-legend">
        {rows.map(([stage, count], index) => (
          <li key={stage}>
            <i
              style={{
                background: ['#0074c8', '#58bafa', '#a9ddff', '#d4edff'][index],
              }}
            />
            <span>{stage.replaceAll('_', ' ')}</span>
            <strong>{count}</strong>
          </li>
        ))}
      </ul>
      {!total && (
        <p className="px-4 pb-4 text-xs text-slate-500">
          No leads recorded yet.
        </p>
      )}
    </SectionCard>
  );
}
