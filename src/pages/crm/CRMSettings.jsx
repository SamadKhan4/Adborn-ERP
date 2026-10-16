import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { stages, label } from '../../../../shared/crm.js';
import { Button } from '../../components/ui/Button.jsx';
import {
  can,
  Field,
  input,
  Message,
  panel,
  QueryState,
  useCRMMutation,
  usePermissions,
} from '../../components/crm/CRMShared.jsx';
function SettingsForm({ data }) {
  const [settings, setSettings] = useState({
    ...data.settings,
    stageLabels: Object.fromEntries(
      stages.map((stage) => [
        stage,
        data.settings.stageLabels?.[stage] || label(stage),
      ]),
    ),
  });
  const mutation = useCRMMutation(
    async () =>
      (
        await api.patch(
          '/crm/settings',
          Object.fromEntries(
            [
              'sources',
              'lostReasons',
              'tags',
              'stageLabels',
              'defaultFollowUpDays',
            ].map((key) => [key, settings[key]]),
          ),
        )
      ).data,
    undefined,
    ['crmMetadata', 'crmSettings'],
  );
  return (
    <form
      className={`${panel} space-y-4`}
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <h3 className="text-sm font-bold">Business configuration</h3>
      {['sources', 'lostReasons', 'tags'].map((key) => (
        <Field key={key} label={`${label(key)} (one per line)`}>
          <textarea
            className={input}
            value={settings[key].join('\n')}
            onChange={(event) =>
              setSettings({
                ...settings,
                [key]: event.target.value.split('\n'),
              })
            }
          />
        </Field>
      ))}
      <Field label="Default follow-up delay (days)">
        <input
          type="number"
          min="1"
          max="365"
          required
          className={input}
          value={settings.defaultFollowUpDays}
          onChange={(event) =>
            setSettings({
              ...settings,
              defaultFollowUpDays: Number(event.target.value),
            })
          }
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        {stages.map((stage) => (
          <Field key={stage} label={stage}>
            <input
              className={input}
              required
              maxLength={80}
              value={settings.stageLabels[stage]}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  stageLabels: {
                    ...settings.stageLabels,
                    [stage]: event.target.value,
                  },
                })
              }
            />
          </Field>
        ))}
      </div>
      <p className="text-[10px] text-slate-500">
        Priority and temperature identifiers remain stable for validation and
        reports.
      </p>
      <Message mutation={mutation} />
      <Button disabled={mutation.isPending}>Save settings</Button>
    </form>
  );
}
function RoleGrants({ role, permissions }) {
  const [grants, setGrants] = useState(role.grants);
  const mutation = useCRMMutation(
    async () =>
      (
        await api.patch(`/crm/settings/roles/${role.name}`, {
          permissions: grants,
        })
      ).data,
    undefined,
    ['crmSettings'],
  );
  return (
    <details className={panel}>
      <summary className="cursor-pointer text-sm font-bold">
        {role.label} · CRM permissions
      </summary>
      <p className="my-3 text-xs text-slate-500">
        Built-in defaults remain active. These controls add grants to an
        existing ERP role. Users see updated grants when their session is
        restored.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {permissions.map((permission) => {
          const builtin =
            role.defaults.includes('*') || role.defaults.includes(permission);
          return (
            <label key={permission} className="break-all text-[10px]">
              <input
                type="checkbox"
                checked={builtin || grants.includes(permission)}
                disabled={builtin}
                onChange={(event) =>
                  setGrants(
                    event.target.checked
                      ? [...grants, permission]
                      : grants.filter((item) => item !== permission),
                  )
                }
              />{' '}
              {permission}
              {builtin ? ' (default)' : ''}
            </label>
          );
        })}
      </div>
      <Message mutation={mutation} />
      <Button
        size="sm"
        className="mt-4"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        Save role grants
      </Button>
    </details>
  );
}
export default function CRMSettings() {
  const permissions = usePermissions();
  const query = useQuery({
    queryKey: ['crmSettings'],
    queryFn: async () => (await api.get('/crm/settings')).data.data,
    enabled: can(permissions, 'crm.settings.manage'),
  });
  if (!can(permissions, 'crm.settings.manage'))
    return (
      <p role="alert">You do not have permission to manage CRM settings.</p>
    );
  return (
    <QueryState query={query}>
      {query.data && (
        <div className="space-y-4">
          <SettingsForm data={query.data} />
          {query.data.roles.map((role) => (
            <RoleGrants
              key={role.name}
              role={role}
              permissions={query.data.permissions}
            />
          ))}
        </div>
      )}
    </QueryState>
  );
}
