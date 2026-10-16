import { tw } from '../../lib/tailwind.js';
import { Outlet } from 'react-router-dom';
import ERPHeader from './ERPHeader.jsx';
import '../../styles/erpDepth.css';
export default function ERPLayout() {
  return (
    <div className={`${tw('erp-shell')} erp-depth`}>
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
