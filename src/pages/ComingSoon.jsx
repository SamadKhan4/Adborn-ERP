import { tw } from '../lib/tailwind.js';
import { Link, useLocation } from 'react-router-dom';
import { Layers3 } from 'lucide-react';
export default function ComingSoon() {
  const { pathname } = useLocation();
  const title = pathname.slice(1).replaceAll('-', ' ');
  return (
    <section className={tw('coming-soon section-card')}>
      <span className={tw('section-icon')}>
        <Layers3 size={25} />
      </span>
      <p className={tw('eyebrow')}>AD BORN ERP</p>
      <h1>{title || 'Module'} is coming soon</h1>
      <p>
        This module is not implemented yet. Your ERP foundation is ready for the
        next phase.
      </p>
      <Link className={tw('primary-button')} to="/">
        Back to dashboard
      </Link>
    </section>
  );
}
