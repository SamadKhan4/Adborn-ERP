import { useId } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import '../../styles/operations.css';
export default function KPICard({
  title,
  value,
  caption,
  icon: Icon,
  tone = 'blue',
  visual = 'line',
  to,
  series = [],
  progress,
}) {
  const gradientId = useId().replaceAll(':', '');
  const maximum = Math.max(...series, 1);
  const points = series
    .map(
      (point, index) =>
        `${series.length > 1 ? (index / (series.length - 1)) * 80 + 2 : 42},${24 - (point / maximum) * 21}`,
    )
    .join(' ');
  return (
    <section className="live-kpi" data-tone={tone}>
      <span className="metric-icon">
        <Icon size={23} />
      </span>
      <div className="reference-kpi-body">
        <h2>{title}</h2>
        <strong className="live-kpi-value">{value}</strong>
      </div>
      {to && (
        <Link
          className="reference-kpi-link"
          to={to}
          aria-label={`View ${title}`}
        >
          <MoreHorizontal size={19} />
        </Link>
      )}
      <small className="reference-kpi-caption">{caption}</small>
      <div className="reference-kpi-visual" aria-hidden="true">
        {progress !== undefined ? (
          <div
            className="reference-attendance-ring"
            style={{
              background: `conic-gradient(#0074c8 ${Math.max(0, Math.min(100, progress))}%, #e3f2ff 0)`,
            }}
          >
            <span>{progress}%</span>
          </div>
        ) : visual === 'bars' ? (
          <div className="reference-mini-bars">
            {series.map((value, index) => (
              <i
                key={index}
                style={{
                  height: `${value ? Math.max(4, (value / maximum) * 100) : 0}%`,
                }}
              />
            ))}
          </div>
        ) : series.length > 1 ? (
          <svg className="sparkline" viewBox="0 0 85 28">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#168bda" stopOpacity=".25" />
                <stop offset="100%" stopColor="#168bda" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={`2,28 ${points} 82,28`}
              fill={`url(#${gradientId})`}
            />
            {series.map((point, index) => (
              <circle
                key={index}
                cx={
                  series.length > 1
                    ? (index / (series.length - 1)) * 80 + 2
                    : 42
                }
                cy={24 - (point / maximum) * 21}
                r="1.5"
                fill="currentColor"
              />
            ))}
            <polyline
              points={points}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </div>
    </section>
  );
}
