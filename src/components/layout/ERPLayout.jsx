import { tw } from '../../lib/tailwind.js';
import { Outlet } from 'react-router-dom';
import ERPHeader from './ERPHeader.jsx';
export default function ERPLayout() {
  return (
    <div className={tw('erp-shell')}>
      <ERPHeader />
      <main className={tw('erp-content')}>
        <Outlet />
      </main>
      <footer className={tw('erp-footer')}>
        AdBorn ERP <span>Designed for a better workday.</span>
      </footer>
    </div>
  );
}
