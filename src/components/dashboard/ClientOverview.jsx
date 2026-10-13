import { tw } from '../../lib/tailwind.js';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { UsersRound, ArrowUpRight } from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
import { clients } from '../../data/dashboardDemo.js';
export default function ClientOverview() {
  return (
    <SectionCard title="Client Overview" icon={UsersRound}>
      <div className={tw('client-summary')}>
        <div>
          <strong>36</strong>
          <p>Total Clients</p>
          <small>
            <ArrowUpRight size={14} /> +4 new clients
          </small>
        </div>
        <div
          className={tw('client-chart')}
          role="img"
          aria-label="Demo clients: 24 active, 8 onboarding, 4 inactive"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={clients}
                dataKey="value"
                innerRadius="66%"
                outerRadius="95%"
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive={false}
              >
                {clients.map((client) => (
                  <Cell key={client.name} fill={client.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <span>
            <strong>36</strong>
            <small>Clients</small>
          </span>
        </div>
      </div>
      <ul className={tw('client-legend')}>
        {clients.map((client) => (
          <li key={client.name}>
            <i style={{ background: client.color }} />
            {client.name} Clients<strong>{client.value}</strong>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
