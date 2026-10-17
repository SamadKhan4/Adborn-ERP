import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';
import {
  financePanel as panel,
  financeInput as input,
  financeButton as button,
  has,
} from '../finance/FinanceShared.jsx';
function Connect({ shared = false, onDone }) {
  const user = useAuthStore((s) => s.user);
  const [password, setPassword] = useState(''),
    [email, setEmail] = useState(shared ? '' : user.email),
    [error, setError] = useState('');
  const cache = useQueryClient();
  const connect = useMutation({
    mutationFn: () =>
      api.post(
        '/mail/accounts/connect',
        {
          emailAddress: email,
          password,
          displayName: shared ? '' : user.name,
          type: shared ? 'SHARED' : 'PERSONAL',
        },
        { timeout: 60000 },
      ),
    onSuccess: () => {
      setPassword('');
      cache.invalidateQueries({ queryKey: ['mail'] });
      onDone?.();
    },
    onError: (e) => {
      setPassword('');
      setError(
        e.response?.data?.error?.message ||
          'Unable to connect. Check your Hostinger credentials.',
      );
    },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        connect.mutate();
      }}
    >
      <h2 className="text-xl font-bold">
        {shared ? 'Connect Shared Mailbox' : 'Connect Your Work Email'}
      </h2>
      <p className="text-xs text-[#71859a]">
        Edit your work email below. Its Hostinger password must verify
        successfully; another employee?s email cannot be connected.
      </p>
      <label className="block text-xs">
        Work email
        <input
          className={input}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-xs">
        Mailbox password
        <input
          aria-label="Mailbox password"
          className={input}
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      <button className={button} disabled={connect.isPending}>
        {connect.isPending ? 'Testing IMAP & SMTP...' : 'Connect Mailbox'}
      </button>
    </form>
  );
}
export function MailConnect() {
  return (
    <section className={`${panel} mx-auto max-w-xl py-10`}>
      <Connect />
    </section>
  );
}
function AccountSettings({ account, onAction }) {
  const [editingEmail, setEditingEmail] = useState(false);
  const [signature, setSignature] = useState(account.signature || ''),
    [displayName, setName] = useState(account.displayName || '');
  return (
    <section className={panel}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{account.emailAddress}</h3>
        {account.type === 'PERSONAL' && (
          <button
            className="text-xs font-semibold text-blue-600"
            onClick={() => setEditingEmail((v) => !v)}
          >
            Edit Work Email
          </button>
        )}
      </div>
      {editingEmail && (
        <div className="my-4 rounded-xl border border-blue-100 p-4">
          <Connect onDone={() => setEditingEmail(false)} />
          <p className="mt-3 text-xs text-slate-500">
            A different address connects as a separate private mailbox. Existing
            mail stays with its original account. Your ERP login email stays
            unchanged.
          </p>
        </div>
      )}
      <p className="my-2 text-xs text-slate-500">
        {account.type} · {account.syncStatus} · Last sync:{' '}
        {account.lastSuccessfulSyncAt
          ? new Date(account.lastSuccessfulSyncAt).toLocaleString('en-IN')
          : 'Not synced yet'}
      </p>
      {account.syncError && (
        <p className="my-3 text-xs text-red-600">{account.syncError}</p>
      )}
      {account.isActive && (
        <div className="space-y-3">
          <label className="block text-xs">
            Display name
            <input
              className={input}
              value={displayName}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-xs">
            Signature
            <textarea
              className={`${input} min-h-24`}
              maxLength={4000}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className={button}
              onClick={() =>
                onAction('patch', `/accounts/${account._id}/settings`, {
                  signature,
                  displayName,
                })
              }
            >
              Save Settings
            </button>
            <button
              className={`${input} !w-auto`}
              onClick={() =>
                onAction('post', `/accounts/${account._id}/test`, {})
              }
            >
              Test Connection
            </button>
            {account.type === 'PERSONAL' && (
              <button
                className="text-xs text-red-600"
                onClick={() => {
                  if (
                    window.confirm(
                      'Disconnect this mailbox? Cached mail stays private; provider mail is retained.',
                    )
                  )
                    onAction('delete', `/accounts/${account._id}/disconnect`);
                }}
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      )}
      {(!account.isActive || account.syncStatus === 'REAUTH_REQUIRED') &&
        account.type === 'PERSONAL' && (
          <div className="mt-5">
            <Connect />
          </div>
        )}
    </section>
  );
}
function SharedAccess({ account, onAction }) {
  const [user, setUser] = useState(''),
    [permissions, setPermissions] = useState(['READ']);
  const query = useQuery({
    queryKey: ['mail', 'access', account],
    queryFn: () =>
      api
        .get(`/mail/admin/accounts/${account}/access`)
        .then((r) => r.data.data),
  });
  return (
    <div className="space-y-3 rounded-xl border border-[#e3edf7] p-4">
      <h3 className="text-sm font-bold">Explicit Shared Mailbox Access</h3>
      <p className="text-xs text-slate-500">
        Administrators have no content access unless assigned here.
      </p>
      {query.data?.items.map((g) => (
        <p className="flex flex-wrap justify-between gap-2 text-xs" key={g._id}>
          <span>
            {g.user?.name} · {g.active ? g.permissions.join(', ') : 'Revoked'}
          </span>
          <button
            className="text-red-600"
            onClick={() =>
              onAction('put', `/admin/accounts/${account}/access`, {
                user: g.user._id,
                permissions: [],
                active: false,
              })
            }
          >
            Revoke
          </button>
        </p>
      ))}
      <select
        aria-label="Shared mailbox user"
        className={input}
        value={user}
        onChange={(e) => setUser(e.target.value)}
      >
        <option value="">Select user</option>
        {query.data?.users.map((u) => (
          <option key={u._id} value={u._id}>
            {u.name} ({u.email})
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-3 text-xs">
        {['READ', 'SEND', 'REPLY', 'FORWARD', 'ARCHIVE', 'TRASH'].map((p) => (
          <label key={p}>
            <input
              type="checkbox"
              checked={permissions.includes(p)}
              onChange={() =>
                setPermissions((v) =>
                  v.includes(p) ? v.filter((k) => k !== p) : [...v, p],
                )
              }
            />{' '}
            {p}
          </label>
        ))}
      </div>
      <button
        className={button}
        disabled={!user}
        onClick={() =>
          onAction('put', `/admin/accounts/${account}/access`, {
            user,
            permissions,
            active: true,
          })
        }
      >
        Save Assignment
      </button>
    </div>
  );
}
export default function MailSettings({ accounts, permissions }) {
  const [notice, setNotice] = useState(''),
    [page, setPage] = useState(1),
    [shared, setShared] = useState(null);
  const cache = useQueryClient();
  const can = (k) => has(permissions, `mail.${k}`);
  const admin = useQuery({
    queryKey: ['mail', 'admin', page],
    queryFn: () =>
      api
        .get('/mail/admin/accounts', { params: { page } })
        .then((r) => r.data.data),
    enabled: can('admin.accounts.view_metadata'),
  });
  const action = useMutation({
    mutationFn: ({ method, path, body }) =>
      api[method](`/mail${path}`, body, { timeout: 60000 }),
    onSuccess: () => {
      setNotice('Updated successfully.');
      cache.invalidateQueries({ queryKey: ['mail'] });
    },
    onError: (e) =>
      setNotice(
        e.response?.data?.error?.message || 'Unable to update mailbox.',
      ),
  });
  const act = (method, path, body) => action.mutate({ method, path, body });
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Mail Settings</h2>
      {notice && (
        <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm">
          {notice}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {accounts.map((a) => (
          <AccountSettings
            key={`${a._id}-${a.syncStatus}`}
            account={a}
            onAction={act}
          />
        ))}
        {!accounts.some((a) => a.type === 'PERSONAL') && (
          <section className={panel}>
            <Connect />
          </section>
        )}
      </div>
      {can('admin.accounts.view_metadata') && (
        <section className={panel}>
          <h2 className="mb-3 text-lg font-bold">System Mailbox Health</h2>
          <p className="mb-4 text-xs text-slate-500">
            Connection metadata only. Personal mailbox contents are never
            available here.
          </p>
          {admin.isError && <p role="alert">Unable to load mailbox health.</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-blue-50">
                <tr>
                  {[
                    'User / Mailbox',
                    'Type',
                    'State',
                    'Last Sync',
                    'Actions',
                  ].map((c) => (
                    <th className="p-3" key={c}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admin.data?.items.map((a) => (
                  <tr key={a._id} className="border-b border-[#e7eff8]">
                    <td className="p-3">
                      {a.user?.name || 'Shared'}
                      <p className="mt-1 text-slate-500">{a.emailAddress}</p>
                    </td>
                    <td>{a.type}</td>
                    <td>{a.isActive ? a.syncStatus : 'Disabled'}</td>
                    <td>
                      {a.lastSuccessfulSyncAt
                        ? new Date(a.lastSuccessfulSyncAt).toLocaleString(
                            'en-IN',
                          )
                        : 'Never'}
                    </td>
                    <td className="space-x-3 text-blue-600">
                      {can('admin.accounts.manage') && (
                        <button
                          onClick={() =>
                            act('patch', `/admin/accounts/${a._id}`, {
                              isActive: !a.isActive,
                            })
                          }
                        >
                          {a.isActive ? 'Disable' : 'Enable'}
                        </button>
                      )}
                      {can('admin.sync.retry') && (
                        <button
                          onClick={() =>
                            act('patch', `/admin/accounts/${a._id}`, {
                              retry: true,
                            })
                          }
                        >
                          Retry Sync
                        </button>
                      )}
                      {a.type === 'SHARED' &&
                        can('shared.manage_permissions') && (
                          <button onClick={() => setShared(a._id)}>
                            Assign Users
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex justify-between text-xs">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={!admin.data || page >= admin.data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
          {shared && (
            <div className="mt-5">
              <SharedAccess account={shared} onAction={act} />
            </div>
          )}
          {can('admin.accounts.manage') && (
            <div className="mt-6 border-t pt-5">
              <Connect shared />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
