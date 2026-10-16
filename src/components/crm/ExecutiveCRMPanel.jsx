import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PhoneCall, Plus } from 'lucide-react';
import { api } from '../../services/api.js';
import LeadForm from './LeadForm.jsx';
import { can, usePermissions } from './CRMShared.jsx';

export default function ExecutiveCRMPanel() {
  const permissions = usePermissions();
  const [create, setCreate] = useState(false);
  const allowed = can(permissions, 'crm.dashboard.view');
  const summary = useQuery({
    queryKey: ['crmDashboard', 'executive-workspace'],
    queryFn: async ({ signal }) => (await api.get('/crm/dashboard', { signal })).data.data,
    enabled: allowed,
    refetchInterval: 60000,
  });
  const leads = useQuery({
    queryKey: ['leads', 'executive-workspace'],
    queryFn: async ({ signal }) => (await api.get('/crm/leads', { signal, params: { limit: 5, page: 1, sort: 'updatedAt', order: 'desc' } })).data.data,
    enabled: allowed,
    refetchInterval: 60000,
  });
  if (!allowed) return null;
  const totals = summary.data?.totals;
  return (
    <section aria-label="Executive CRM workspace" className="rounded-[20px] border border-[#e5edf6] bg-white p-5 shadow-[0_12px_38px_#315d860c]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-base font-bold text-[#10254b]">My Sales Workspace</h2><p className="mt-1 text-xs text-[#71859a]">Your leads, calls and follow-ups alongside your daily employee work.</p></div>
        {can(permissions, 'crm.leads.create') && <button type="button" onClick={() => setCreate(true)} className="flex items-center gap-2 rounded-xl bg-[#087dda] px-4 py-2 text-xs font-semibold text-white"><Plus size={15} />Add Lead</button>}
      </div>
      {summary.isPending && <p role="status" className="mt-4 text-xs">Loading CRM summary…</p>}
      {summary.isError && <p role="alert" className="mt-4 text-xs">Unable to load CRM summary. <button type="button" onClick={() => summary.refetch()} className="underline">Retry</button></p>}
      {totals && <div className="my-4 grid grid-cols-2 gap-3 xl:grid-cols-4">{[
        ['My Leads', totals.total, '/crm/leads'],
        ['Open Leads', totals.open, '/crm/leads'],
        ['Follow-ups Today', totals.followupsToday, '/crm/follow-ups'],
        ['Overdue Follow-ups', totals.overdueFollowups, '/crm/follow-ups'],
      ].map(([label, value, path]) => <Link key={label} to={path} className="rounded-2xl border border-[#dceaf5] bg-[#f2f9ff] p-4"><strong className="block text-2xl text-[#087cc5]">{value ?? 0}</strong><span className="text-xs text-[#5875b3]">{label}</span></Link>)}</div>}
      <div className="my-4 flex flex-wrap gap-4 text-xs font-semibold text-[#087cc5]">
        <Link to="/crm/leads" className="flex items-center gap-2"><PhoneCall size={15} />Open leads & log calls</Link>
        <Link to="/crm/follow-ups">Manage follow-ups</Link><Link to="/crm/pipeline">My pipeline</Link><Link to="/crm/activities">Call & activity history</Link>
      </div>
      <h3 className="text-xs font-semibold">Recently updated leads</h3>
      {leads.isPending && <p role="status" className="mt-3 text-xs">Loading leads…</p>}
      {leads.isError && <p role="alert" className="mt-3 text-xs">Unable to load leads. <button type="button" onClick={() => leads.refetch()} className="underline">Retry</button></p>}
      {leads.isSuccess && !leads.data?.items?.length && <p className="mt-3 text-xs text-[#71859a]">No leads assigned yet. Add your first lead to start working.</p>}
      <ul className="mt-2 divide-y divide-[#e5edf6]">{(leads.data?.items || []).map((lead) => <li key={lead._id}><Link to={`/crm/leads/${lead._id}`} className="flex items-center justify-between gap-3 py-3 text-xs"><span><strong>{lead.companyName}</strong><span className="ml-2 text-[#71859a]">{lead.contactPerson || lead.phone}</span></span><span className="text-[#087cc5]">{lead.stage?.replaceAll('_', ' ')} →</span></Link></li>)}</ul>
      <p className="mt-2 text-[10px] text-[#71859a]">Open a lead to record a call, update its stage, or schedule a follow-up.</p>
      {create && <LeadForm onClose={() => setCreate(false)} />}
    </section>
  );
}
