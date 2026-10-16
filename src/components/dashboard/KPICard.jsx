import { tw } from '../../lib/tailwind.js';
export default function KPICard({ title, value, caption, icon: Icon }) {
  return (
    <section className={tw('kpi-card')}>
      <div className={tw('kpi-icon')}>
        <Icon size={26} />
      </div>
      <div className={tw('kpi-body')}>
        <h2>{title}</h2>
        <strong className={tw('kpi-value')}>{value}</strong>
        <p className="mt-3 text-xs text-slate-500">{caption}</p>
      </div>
    </section>
  );
}
