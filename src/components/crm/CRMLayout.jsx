import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { can, usePermissions } from './CRMShared.jsx';
import '../../styles/crmDepth.css';
const tabs = [
  ['Overview', '/crm', 'crm.dashboard.view'],
  ['Leads', '/crm/leads', 'leads'],
  ['Pipeline', '/crm/pipeline', 'crm.pipeline.view'],
  ['Follow-ups', '/crm/follow-ups', 'followups'],
  ['Activities', '/crm/activities', 'crm.activities.view'],
  ['Reports', '/crm/reports', 'crm.reports.view'],
  ['Settings', '/crm/settings', 'crm.settings.manage'],
];
export default function CRMLayout() {
  const role = useAuthStore((state) => state.user?.role);
  const permissions = usePermissions();
  if (role === 'team_leader') return <Navigate to="/employee" replace />;
  const view = (permission) =>
    permission === 'leads'
      ? ['crm.leads.view', 'crm.leads.view_own', 'crm.leads.view_team'].some(
          (item) => can(permissions, item),
        )
      : permission === 'followups'
        ? ['crm.followups.view', 'crm.followups.view_own'].some((item) =>
            can(permissions, item),
          )
        : can(permissions, permission);
  if (!tabs.some((tab) => view(tab[2])))
    return <p role="alert">You do not have permission to access CRM.</p>;
  return (
    <div className="crm-depth space-y-5 text-[#173958]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#0987c4]">
          Sales workspace
        </p>
        <h1 className="mt-1 text-2xl font-bold">Customer Relationships</h1>
      </div>
      <nav
        aria-label="CRM navigation"
        className="flex gap-1 overflow-x-auto rounded-2xl border border-[#e5edf6] bg-white p-2"
      >
        {tabs
          .filter((tab) => view(tab[2]))
          .map(([name, path]) => (
            <NavLink
              key={path}
              end={path === '/crm'}
              to={path}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${isActive ? 'bg-[#eaf5fc] text-[#006eb5]' : 'text-[#657b93] hover:bg-slate-50'}`
              }
            >
              {name}
            </NavLink>
          ))}
      </nav>
      <Outlet />
    </div>
  );
}
