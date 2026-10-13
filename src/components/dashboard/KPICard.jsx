import { tw } from '../../lib/tailwind.js';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
export default function KPICard({
  title,
  value,
  change,
  caption,
  icon: Icon,
  kind,
  negative = false,
}) {
  return (
    <section className={tw('kpi-card')}>
      <div className={tw(`kpi-icon ${negative ? 'rose' : ''}`)}>
        <Icon size={26} />
      </div>
      <div className={tw('kpi-body')}>
        <h2>{title}</h2>
        <strong className={tw('kpi-value')}>{value}</strong>
      </div>
      <MoreHorizontal className={tw('kpi-more')} size={20} aria-hidden="true" />
      <div className={tw(`kpi-trend ${negative ? 'negative' : ''}`)}>
        {negative ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
        <strong>{change}</strong>
        <span>{caption}</span>
      </div>
      <div className={tw('kpi-visual')} aria-hidden="true">
        {kind === 'ring' ? (
          <div className={tw('attendance-ring')}>
            <span>92%</span>
          </div>
        ) : kind === 'line' ? (
          <svg viewBox="0 0 100 70">
            <defs>
              <linearGradient id="spark" x2="0" y2="1">
                <stop stopColor="#48abed" stopOpacity=".4" />
                <stop offset="1" stopColor="#48abed" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M4 61 19 54 33 39 47 43 61 24 75 28 92 5 V70 H4Z"
              fill="url(#spark)"
            />
            <path
              d="M4 61 19 54 33 39 47 43 61 24 75 28 92 5"
              fill="none"
              stroke="#0781cf"
              strokeWidth="2"
            />
            {[
              [4, 61],
              [19, 54],
              [33, 39],
              [47, 43],
              [61, 24],
              [75, 28],
              [92, 5],
            ].map(([cx, cy]) => (
              <circle key={cx} cx={cx} cy={cy} r="2.6" fill="#0781cf" />
            ))}
          </svg>
        ) : (
          <div className={tw(`mini-bars ${negative ? 'negative' : ''}`)}>
            {(negative
              ? [22, 40, 62, 78, 54, 68]
              : [22, 30, 40, 55, 70, 88]
            ).map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
