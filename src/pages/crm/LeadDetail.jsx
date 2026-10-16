import {
  StageDialog,
  AssignDialog,
  ArchiveDialog,
} from '../../components/crm/LeadActions.jsx';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { Button } from '../../components/ui/Button.jsx';
import LeadForm from '../../components/crm/LeadForm.jsx';
import {
  Badge,
  can,
  date,
  money,
  panel,
  QueryState,
  usePermissions,
} from '../../components/crm/CRMShared.jsx';
import { label } from '../../../shared/crm.js';
import ActivityTimeline from '../../components/crm/ActivityTimeline.jsx';
import ActivityForm from '../../components/crm/ActivityForm.jsx';
import FollowUps from './FollowUps.jsx';
import FollowUpForm from '../../components/crm/FollowUpForm.jsx';
import {
  ConvertDialog,
  LeadQuotations,
  LeadDocuments,
} from '../../components/crm/LeadBusinessPanels.jsx';
export default function LeadDetail() {
  const { id } = useParams();
  const [edit, setEdit] = useState(false);
  const permissions = usePermissions();
  const query = useQuery({
    queryKey: ['lead', id],
    queryFn: async ({ signal }) =>
      (await api.get(`/crm/leads/${id}`, { signal })).data.data,
  });
  const [action, setAction] = useState(null);
  const [tab, setTab] = useState('overview');
  const [activity, setActivity] = useState(null);
  const lead = query.data;
  return (
    <QueryState query={query}>
      {lead && (
        <div className="space-y-5">
          <Link to="/crm/leads" className="text-xs text-blue-700">
            ← All leads
          </Link>
          <section className={panel}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">{lead.leadId}</p>
                <h2 className="my-2 text-2xl font-bold">{lead.companyName}</h2>
                <div className="flex gap-2">
                  <Badge value={lead.stage} />
                  <Badge value={lead.priority} />
                  <Badge value={lead.temperature} />
                </div>
              </div>
              {can(permissions, 'crm.leads.edit') && (
                <Button onClick={() => setEdit(true)}>Edit Lead</Button>
              )}
            </div>
            <dl className="mt-6 grid gap-5 text-xs sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Contact', lead.contactPerson],
                ['Phone', lead.phone],
                ['WhatsApp', lead.whatsapp],
                ['Email', lead.email],
                ['Website', lead.website],
                ['Source', lead.leadSource],
                ['Owner', lead.assignedTo?.name],
                ['Value', money(lead.estimatedBudget, lead.currency)],
                ['Services', lead.interestedServices.map(label).join(', ')],
                ['Created', date(lead.createdAt)],
                ['Next follow-up', date(lead.nextFollowUpAt)],
                ['Expected close', date(lead.expectedClosingDate)],
                ['Probability', `${lead.probability}%`],
                ['Last activity', date(lead.lastActivityAt)],
                ['Address', Object.values(lead.address || {}).join(', ')],
                ['Tags', lead.tags.join(', ')],
              ].map(([title, value]) => (
                <div key={title}>
                  <dt className="text-slate-500">{title}</dt>
                  <dd className="mt-1 break-words font-medium">
                    {value || '—'}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 whitespace-pre-wrap text-xs">{lead.notes}</p>
          </section>
          <div className="flex flex-wrap gap-2">
            {can(permissions, 'crm.followups.create') && <Button size="sm" onClick={() => setAction('followup')}>Add Follow-up</Button>}
            {can(permissions, 'quotations.manage') && <Button size="sm" variant="secondary" onClick={() => setTab('quotations')}>Create Quotation</Button>}
            {can(permissions, 'crm.leads.delete') && !lead.convertedClientId && <Button size="sm" variant="secondary" onClick={() => setAction('archive')}>Archive Lead</Button>}
            {can(permissions, 'crm.leads.edit') &&
              ['NOTE', 'CALL', 'WHATSAPP', 'EMAIL', 'MEETING'].map((type) => (
                <Button
                  key={type}
                  variant="secondary"
                  size="sm"
                  onClick={() => setActivity(type)}
                >
                  {type === 'NOTE'
                    ? 'Add Note'
                    : type === 'MEETING'
                      ? 'Schedule Meeting'
                      : `Log ${label(type)}`}
                </Button>
              ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {can(permissions, 'crm.leads.assign') && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAction('assign')}
              >
                Assign / Reassign
              </Button>
            )}
            {(can(permissions, 'crm.leads.change_stage') ||
              can(permissions, 'crm.pipeline.manage')) && (
              <>
                <Button size="sm" onClick={() => setAction('stage')}>
                  Change Stage
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setAction('WON')}
                >
                  Mark Won
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setAction('LOST')}
                >
                  Mark Lost
                </Button>
              </>
            )}
          </div>
          {lead.convertedClientId ? (
            <Link
              className="text-sm font-semibold text-emerald-700"
              to={`/crm/clients/${lead.convertedClientId}`}
            >
              Converted to Client · View Client ?
            </Link>
          ) : (
            can(permissions, 'crm.leads.convert') && (
              <Button onClick={() => setAction('convert')}>
                Convert to Client
              </Button>
            )
          )}
          {action === 'convert' && (
            <ConvertDialog lead={lead} onClose={() => setAction(null)} />
          )}
          {action === 'archive' && <ArchiveDialog lead={lead} onClose={() => setAction(null)} />}
          {action === 'followup' && <FollowUpForm leadId={id} onClose={() => setAction(null)} />}
          {action === 'assign' && (
            <AssignDialog lead={lead} onClose={() => setAction(null)} />
          )}
          {['stage', 'WON', 'LOST'].includes(action) && (
            <StageDialog
              lead={lead}
              stage={action === 'stage' ? undefined : action}
              onClose={() => setAction(null)}
            />
          )}
          <nav aria-label="Lead tabs" className="flex gap-2 overflow-x-auto">
            {[
              'overview',
              'activity',
              'follow-ups',
              'quotations',
              'documents',
              'notes',
            ].map((value) => (
              <Button
                key={value}
                size="sm"
                variant={tab === value ? 'primary' : 'secondary'}
                onClick={() => setTab(value)}
              >
                {label(value)}
              </Button>
            ))}
          </nav>
          {tab === 'quotations' && <LeadQuotations lead={lead} />}
          {tab === 'documents' && <LeadDocuments lead={lead} />}
          {tab === 'activity' && <ActivityTimeline leadId={id} />}
          {tab === 'notes' && <ActivityTimeline leadId={id} notesOnly />}
          {tab === 'follow-ups' && <FollowUps leadId={id} />}
          {activity && (
            <ActivityForm
              leadId={id}
              type={activity}
              onClose={() => setActivity(null)}
            />
          )}
          {edit && <LeadForm lead={lead} onClose={() => setEdit(false)} />}
        </div>
      )}
    </QueryState>
  );
}
