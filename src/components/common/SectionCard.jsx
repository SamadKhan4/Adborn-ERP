import { tw } from '../../lib/tailwind.js';
export default function SectionCard({
  title,
  icon: Icon,
  subtitle,
  actions,
  className = '',
  children,
}) {
  return (
    <section className={tw(`section-card ${className}`)}>
      <header className={tw('section-heading')}>
        <span className={tw('section-icon')}>{Icon && <Icon size={20} />}</span>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className={tw('section-actions')}>{actions}</div>
      </header>
      {children}
    </section>
  );
}
