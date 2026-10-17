import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Inbox,
  Star,
  Send,
  FileText,
  Archive,
  ShieldAlert,
  Trash2,
  Search,
  Paperclip,
  RefreshCw,
  Settings,
  Reply,
  ReplyAll,
  Forward,
  ArrowLeft,
  MoreHorizontal,
  Tag,
  FolderKanban,
  ChevronRight,
  Mail,
  Link2,
  Download,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useDebounced } from '../components/crm/CRMShared.jsx';
import {
  financePanel as panel,
  financeInput as input,
  financeButton as button,
  has,
} from '../components/finance/FinanceShared.jsx';
import MailCompose from '../components/mail/MailCompose.jsx';
import MailSettings, { MailConnect } from '../components/mail/MailSettings.jsx';
const folders = [
  ['inbox', 'Inbox', Inbox],
  ['starred', 'Starred', Star],
  ['sent', 'Sent', Send],
  ['drafts', 'Drafts', FileText],
  ['archive', 'Archive', Archive],
  ['spam', 'Spam', ShieldAlert],
  ['trash', 'Trash', Trash2],
];
const get = (path, params) =>
  api.get(`/mail${path}`, { params }).then((r) => r.data.data);
const time = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      })
    : '';
function Avatar({ value }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-[#76c6ff] to-[#1683db] text-sm font-semibold text-white shadow-sm">
      {String(value || '?')[0].toUpperCase()}
    </span>
  );
}
function State({ query, children }) {
  if (query.isPending)
    return (
      <p role="status" className="p-6 text-sm text-slate-500">
        Loading mail...
      </p>
    );
  if (query.isError)
    return (
      <div role="alert" className="p-5 text-xs text-red-600">
        {query.error.response?.data?.error?.message || 'Unable to load mail.'}
        <button className="ml-3 text-blue-600" onClick={() => query.refetch()}>
          Retry
        </button>
      </div>
    );
  return children;
}
export default function MailWorkspace() {
  const location = useLocation(),
    navigate = useNavigate(),
    cache = useQueryClient();
  const parts = location.pathname.split('/').filter(Boolean),
    section = parts[1] || 'inbox';
  const pathId = section === 'message' ? parts[2] : null;
  const threadId = section === 'thread' ? parts[2] : null;
  const [selectedAccount, setAccount] = useState(''),
    [selectedMessage, setMessage] = useState(null),
    [folder, setFolder] = useState('inbox'),
    [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    [unread, setUnread] = useState(false),
    [compose, setCompose] = useState(null),
    [notice, setNotice] = useState(''),
    [labelFilter, setLabelFilter] = useState('');
  const debounced = useDebounced(search);
  const accountQuery = useQuery({
    queryKey: ['mail', 'accounts'],
    queryFn: () => get('/accounts'),
    refetchInterval: 30000,
  });
  const accounts = accountQuery.data?.items || [];
  const permissions = accountQuery.data?.permissions || [];
  const can = (k) => has(permissions, `mail.${k}`);
  const account =
    accounts.find((a) => a._id === selectedAccount) ||
    accounts.find((a) => a.isActive) ||
    accounts[0];
  const activeFolder = folders.some(([k]) => k === section) ? section : folder;
  const messageId = pathId || selectedMessage;
  const settings = section === 'settings';
  const read = Boolean(
    account?.isActive && account.permissions.includes('READ'),
  );
  const list = useQuery({
    queryKey: [
      'mail',
      'messages',
      account?._id,
      activeFolder,
      debounced,
      page,
      unread,
      labelFilter,
    ],
    queryFn: () =>
      get('/messages', {
        mailAccountId: account._id,
        folder: activeFolder.toUpperCase(),
        search: debounced,
        page,
        ...(unread ? { unread: 'true' } : {}),
        ...(labelFilter ? { label: labelFilter } : {}),
      }),
    enabled: read && !settings,
    refetchInterval: 30000,
  });
  const detail = useQuery({
    queryKey: ['mail', 'message', messageId],
    queryFn: () => get(`/messages/${messageId}`),
    enabled: Boolean(messageId) && !settings,
  });
  const jobQuery = useQuery({
    queryKey: ['mail', 'jobs', account?._id],
    queryFn: () => get('/jobs', { mailAccountId: account._id }),
    enabled:
      Boolean(account?.isActive && account.permissions.includes('SEND')) &&
      !settings,
    refetchInterval: 15000,
  });
  const action = useMutation({
    mutationFn: ({ method = 'post', path, body }) =>
      api[method](`/mail${path}`, body, { timeout: 60000 }),
    onSuccess: (_, variables) => {
      if (/\/(archive|trash|spam|restore)$/.test(variables.path)) {
        setMessage(null);
        navigate(`/mail/${activeFolder}`);
      }
      cache.invalidateQueries({ queryKey: ['mail'] });
      setNotice('Updated successfully.');
    },
    onError: (e) =>
      setNotice(e.response?.data?.error?.message || 'Mail operation failed.'),
  });
  const act = (path, body, method) => action.mutate({ path, body, method });
  const choose = (m) => {
    setMessage(m._id);
    setFolder(activeFolder);
    navigate(`/mail/message/${m._id}`);
    if (!m.isRead) act(`/messages/${m._id}/read`, { value: true }, 'patch');
  };
  const goFolder = (f) => {
    setMessage(null);
    setPage(1);
    setLabelFilter('');
    setFolder(f);
    navigate(`/mail/${f}`);
  };
  const composeAccount = detail.data
    ? accounts.find((a) => a._id === detail.data.mailAccount) || account
    : account;
  const thread = useQuery({
    queryKey: ['mail', 'thread', threadId, account?._id],
    queryFn: () => get(`/threads/${threadId}`, { mailAccountId: account._id }),
    enabled: Boolean(threadId && account),
  });
  return (
    <main className="space-y-4 text-[#10164d]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mail</h1>
          <p className="mt-1 text-sm text-[#687eab]">
            Manage your business emails, stay connected and collaborate.
          </p>
        </div>
        <div className="flex gap-2">
          {account?.isActive && read && (
            <button
              className={`${input} !w-auto`}
              disabled={action.isPending}
              onClick={() => act(`/accounts/${account._id}/sync`, {})}
            >
              <RefreshCw size={14} className="mr-2 inline" />
              Sync Now
            </button>
          )}
          <Link className={`${input} !w-auto`} to="/mail/settings">
            <Settings size={15} className="mr-2 inline" />
            Mail Settings
          </Link>
        </div>
      </header>
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-blue-50 p-3 text-xs text-blue-800"
        >
          {notice}
          <button className="float-right" onClick={() => setNotice('')}>
            ×
          </button>
        </p>
      )}
      <State query={accountQuery}>
        {settings ? (
          <MailSettings accounts={accounts} permissions={permissions} />
        ) : accounts.length === 0 ? (
          <>
            <MailConnect />
            {can('admin.accounts.view_metadata') && (
              <p className="text-center text-xs text-slate-500">
                Shared mailboxes and system health are available in Mail
                Settings.
              </p>
            )}
          </>
        ) : (
          <div className="grid min-h-[690px] items-start gap-3 lg:grid-cols-[190px_310px_minmax(0,1fr)] 2xl:grid-cols-[200px_330px_minmax(0,1fr)_270px]">
            <aside
              className={`${panel} space-y-5 !p-3 ${messageId ? 'hidden lg:block' : ''}`}
            >
              <button
                className={`${button} w-full !bg-[#008aff] !py-3`}
                disabled={
                  !account?.isActive ||
                  !can('compose') ||
                  !can('send') ||
                  !account.permissions.includes('SEND')
                }
                onClick={() => setCompose({ mode: 'new' })}
              >
                <Plus size={17} />
                Compose
              </button>
              <nav className="space-y-1">
                {folders.map(([key, title, Icon]) => {
                  const count = list.data?.counts.find(
                    (c) => c._id === key.toUpperCase(),
                  );
                  return (
                    <button
                      key={key}
                      onClick={() => goFolder(key)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs ${activeFolder === key ? 'bg-[#e9f6ff] font-semibold text-[#008aff]' : 'text-[#35477c]'}`}
                    >
                      <Icon size={16} />
                      {title}
                      {count && (
                        <span className="ml-auto rounded bg-[#d9edff] px-1.5 py-0.5 text-[10px]">
                          {key === 'inbox' ? count.unread : count.total}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
              <div className="space-y-2">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-[#6f83a6]">
                  Labels <Tag size={12} className="float-right" />
                </p>
                {[
                  ...new Set(
                    (list.data?.items || []).flatMap((m) => m.labels || []),
                  ),
                ]
                  .slice(0, 12)
                  .map((l, i) => (
                    <button
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${labelFilter === l ? 'bg-blue-50' : ''}`}
                      key={l}
                      onClick={() => {
                        setLabelFilter((v) => (v === l ? '' : l));
                        setPage(1);
                      }}
                    >
                      <span
                        className="size-2 rounded-sm"
                        style={{
                          background: [
                            '#14b9e9',
                            '#f468ae',
                            '#15c887',
                            '#ffab32',
                          ][i % 4],
                        }}
                      />
                      {l}
                    </button>
                  ))}
                {!(list.data?.items || []).some((m) => m.labels?.length) && (
                  <p className="text-[10px] text-slate-400">
                    Add labels from an open email.
                  </p>
                )}
              </div>
              <div>
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-[#6f83a6]">
                  Connected Accounts
                </p>
                {accounts.map((a) => (
                  <button
                    className={`mb-1 flex w-full items-center gap-2 overflow-hidden rounded-lg px-2 py-2 text-left text-[10px] ${account?._id === a._id ? 'bg-[#eef8ff]' : 'text-[#536e98]'}`}
                    key={a._id}
                    onClick={() => {
                      setAccount(a._id);
                      setMessage(null);
                      setPage(1);
                      navigate('/mail/inbox');
                    }}
                  >
                    <i
                      className={`size-1.5 shrink-0 rounded-full ${a.isActive ? 'bg-[#008aff]' : 'bg-slate-400'}`}
                    />
                    <span className="truncate">{a.emailAddress}</span>
                  </button>
                ))}
                <Link
                  to="/mail/settings"
                  className="mt-3 block text-[10px] text-blue-600"
                >
                  + Connect / manage accounts
                </Link>
                <p className="mt-4 text-[9px] text-[#7d91af]">
                  {account?.syncStatus}
                  <br />
                  Last sync: {time(account?.lastSuccessfulSyncAt) || 'Pending'}
                </p>
              </div>
            </aside>
            <section
              className={`${panel} overflow-hidden !p-0 ${messageId ? 'hidden lg:block' : ''}`}
            >
              <div className="border-b border-[#e7eff8] p-3">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-3 text-[#53729b]"
                  />
                  <input
                    aria-label="Search mail"
                    className={`${input} !bg-[#f6fbff] pl-9`}
                    placeholder="Search emails, senders or attachments..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <button className="border-b-2 border-[#008aff] pb-2 font-semibold text-[#008aff]">
                    {activeFolder[0].toUpperCase() + activeFolder.slice(1)}{' '}
                    <span className="rounded bg-blue-50 px-1">
                      {list.data?.total || 0}
                    </span>
                  </button>
                  <label className="text-[#7085a8]">
                    <input
                      type="checkbox"
                      checked={unread}
                      onChange={(e) => {
                        setUnread(e.target.checked);
                        setPage(1);
                      }}
                    />{' '}
                    Unread
                  </label>
                </div>
              </div>
              {!read ? (
                <p className="p-5 text-xs text-slate-500">
                  {account?.isActive
                    ? 'This shared mailbox grants sending access only.'
                    : 'Reconnect this mailbox in Mail Settings.'}
                </p>
              ) : (
                <State query={list}>
                  <div className="max-h-[690px] overflow-y-auto">
                    {list.data?.items.map((m) => (
                      <article
                        key={m._id}
                        className={`flex gap-2 border-b border-[#eaf1f8] p-3 ${messageId === m._id ? 'bg-[#edf8ff]' : !m.isRead ? 'bg-[#f7fcff]' : 'bg-white'}`}
                      >
                        <button
                          aria-label={`Open ${m.subject}`}
                          className="flex min-w-0 flex-1 gap-3 text-left"
                          onClick={() => choose(m)}
                        >
                          <Avatar value={m.from?.name || m.from?.address} />
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between gap-2">
                              <p
                                className={`truncate text-[11px] ${m.isRead ? 'font-medium' : 'font-bold'}`}
                              >
                                {m.from?.name ||
                                  m.from?.address ||
                                  'Unknown sender'}
                              </p>
                              <span className="shrink-0 text-[9px] text-[#6b82a7]">
                                {time(m.receivedAt)}
                              </span>
                            </div>
                            <p
                              className={`mt-1 truncate text-[11px] ${!m.isRead ? 'font-bold' : ''}`}
                            >
                              {m.subject || '(No subject)'}
                            </p>
                            <p className="mt-1 truncate text-[10px] text-[#7890b1]">
                              {m.snippet}
                            </p>
                            <div className="mt-1 flex gap-2 text-[9px] text-[#3d86cf]">
                              {m.attachments?.length > 0 && (
                                <Paperclip size={11} />
                              )}{' '}
                              {(m.linkedProject ||
                                m.linkedClient ||
                                m.linkedLead ||
                                m.linkedInvoice ||
                                m.linkedQuotation) && <Link2 size={11} />}
                            </div>
                          </div>
                        </button>
                        <button
                          aria-label={`${m.isStarred ? 'Unstar' : 'Star'} ${m.subject}`}
                          className={`self-end ${m.isStarred ? 'text-amber-400' : 'text-[#a9bcd5]'}`}
                          onClick={() =>
                            act(
                              `/messages/${m._id}/star`,
                              { value: !m.isStarred },
                              'patch',
                            )
                          }
                        >
                          <Star
                            size={14}
                            fill={m.isStarred ? 'currentColor' : 'none'}
                          />
                        </button>
                      </article>
                    ))}
                    {!list.data?.items.length && (
                      <p className="p-10 text-center text-xs text-slate-500">
                        No emails in this view.
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between p-3 text-[10px] text-[#6680a5]">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <span>
                      {page} / {Math.max(1, list.data?.totalPages || 0)}
                    </span>
                    <button
                      disabled={!list.data || page >= list.data.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                  <button
                    className="w-full border-t border-[#e7eff8] p-3 text-[10px] text-blue-600"
                    onClick={() =>
                      act(`/accounts/${account._id}/sync`, {
                        older: true,
                        folder: activeFolder.toUpperCase(),
                      })
                    }
                  >
                    Load older mail from Hostinger
                  </button>
                  <p className="px-3 pb-3 text-[9px] text-slate-400">
                    Search covers synced mail. Load older mail to expand
                    history.
                  </p>
                </State>
              )}
            </section>
            <section
              className={`${panel} min-w-0 !p-0 ${!messageId ? 'hidden lg:block' : ''}`}
            >
              {messageId ? (
                <State query={detail}>
                  {detail.data && (
                    <MailReader
                      key={detail.data._id}
                      message={detail.data}
                      account={composeAccount}
                      can={can}
                      act={act}
                      onBack={() => {
                        setMessage(null);
                        navigate(`/mail/${activeFolder}`);
                      }}
                      onCompose={(mode) =>
                        setCompose({ mode, source: detail.data })
                      }
                    />
                  )}
                </State>
              ) : (
                <div className="grid min-h-[580px] place-items-center p-6 text-center text-[#8da1bc]">
                  <div>
                    <Mail className="mx-auto mb-4" size={40} />
                    <p className="text-sm">Select an email to read</p>
                    <p className="mt-2 text-xs">Your mailbox stays private.</p>
                    {account?.syncError && (
                      <p className="mt-5 text-xs text-red-600">
                        {account.syncError}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {jobQuery.data?.items.length > 0 && (
                <details className="border-t border-[#e7eff8] p-4 text-xs">
                  <summary className="cursor-pointer font-semibold">
                    Recent sending activity
                  </summary>
                  {jobQuery.data.items.slice(0, 10).map((j) => (
                    <div className="mt-3" key={j._id}>
                      <span>
                        {j.status} · {time(j.sentAt || j.createdAt)}
                      </span>
                      {j.lastError && (
                        <p className="mt-1 text-[10px] text-amber-700">
                          {j.lastError}
                        </p>
                      )}
                    </div>
                  ))}
                </details>
              )}
            </section>
            <aside className="hidden space-y-3 2xl:block">
              {messageId && detail.data ? (
                <Related message={detail.data} />
              ) : (
                <section className={panel}>
                  <h2 className="text-sm font-bold">Related To</h2>
                  <p className="mt-3 text-xs text-slate-500">
                    Open an email to view authorized ERP connections.
                  </p>
                </section>
              )}
              <section className={panel}>
                <h3 className="text-sm font-bold">Mailbox Privacy</h3>
                <p className="mt-3 text-[11px] leading-5 text-[#7187a9]">
                  Personal emails are visible only to their owner. Shared
                  mailboxes require explicit access. Linking a record never
                  shares the email.
                </p>
              </section>
            </aside>
          </div>
        )}
      </State>
      {threadId && (
        <section className={panel}>
          <h2 className="font-bold">Conversation</h2>
          <State query={thread}>
            {thread.data?.items.map((m) => (
              <Link
                className="mt-3 block text-xs text-blue-600"
                key={m._id}
                to={`/mail/message/${m._id}`}
              >
                {m.subject} · {time(m.receivedAt)}
              </Link>
            ))}
          </State>
        </section>
      )}
      {compose && composeAccount && (
        <MailCompose
          key={`${compose.mode}-${compose.source?._id || 'new'}`}
          mode={compose.mode}
          source={compose.source}
          accounts={accounts}
          account={composeAccount}
          onClose={(result) => {
            setCompose(null);
            setNotice(
              result?.saved
                ? 'Saved. Delivery and provider sync status will update shortly.'
                : '',
            );
          }}
        />
      )}
    </main>
  );
}
function MailReader({ message: m, account, can, act, onBack, onCompose }) {
  const [remote, setRemote] = useState(false),
    [showHtml, setShowHtml] = useState(false),
    [labels, setLabels] = useState((m.labels || []).join(', ')),
    [error, setError] = useState('');
  const html = useQuery({
    queryKey: ['mail', 'html', m._id, remote],
    queryFn: () => get(`/messages/${m._id}/html`, { remote: String(remote) }),
    enabled: showHtml,
  });
  const access = (op) => account?.permissions.includes(op);
  const download = async (a) => {
    try {
      const { data } = await api.get(`/mail/attachments/${m._id}/${a._id}`, {
        responseType: 'blob',
        timeout: 60000,
      });
      const url = URL.createObjectURL(data),
        link = document.createElement('a');
      link.href = url;
      link.download = a.fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('Attachment unavailable or download denied.');
    }
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-b border-[#e7eff8] px-4 py-3 text-[10px] text-[#39517c]">
        <button aria-label="Back to mail list" onClick={onBack}>
          <ArrowLeft size={15} />
        </button>
        {can('reply') && access('REPLY') && (
          <>
            <button onClick={() => onCompose('reply')}>
              <Reply size={14} className="mr-1 inline" />
              Reply
            </button>
            <button onClick={() => onCompose('reply-all')}>
              <ReplyAll size={14} className="mr-1 inline" />
              Reply All
            </button>
          </>
        )}
        {can('forward') && access('FORWARD') && (
          <button onClick={() => onCompose('forward')}>
            <Forward size={14} className="mr-1 inline" />
            Forward
          </button>
        )}
        {access('ARCHIVE') && (
          <button onClick={() => act(`/messages/${m._id}/archive`, {})}>
            <Archive size={14} className="mr-1 inline" />
            Archive
          </button>
        )}
        {access('TRASH') && (
          <button onClick={() => act(`/messages/${m._id}/trash`, {})}>
            <Trash2 size={14} />
          </button>
        )}
        <details className="relative ml-auto">
          <summary className="cursor-pointer">
            <MoreHorizontal size={17} />
          </summary>
          <div
            className={`${panel} absolute right-0 z-10 w-40 space-y-3 text-[10px]`}
          >
            <button
              className="block"
              onClick={() =>
                act(`/messages/${m._id}/read`, { value: !m.isRead }, 'patch')
              }
            >
              Mark {m.isRead ? 'unread' : 'read'}
            </button>
            {access('TRASH') && (
              <>
                <button
                  className="block"
                  onClick={() => act(`/messages/${m._id}/spam`, {})}
                >
                  Move to Spam
                </button>
                <button
                  className="block"
                  onClick={() => act(`/messages/${m._id}/restore`, {})}
                >
                  Move to Inbox
                </button>
              </>
            )}
            <Link className="block" to={`/mail/thread/${m.threadKey}`}>
              View conversation
            </Link>
          </div>
        </details>
      </div>
      <div className="p-5">
        <h2 className="text-xl font-bold tracking-tight">{m.subject}</h2>
        <div className="mt-4 flex gap-3">
          <Avatar value={m.from?.name || m.from?.address} />
          <div className="min-w-0 flex-1">
            <p className="break-words text-xs font-semibold">
              {m.from?.name}{' '}
              <span className="font-normal text-[#7b8fac]">
                &lt;{m.from?.address}&gt;
              </span>
            </p>
            <p className="mt-1 break-words text-[10px] text-[#7187a9]">
              To {m.to.map((a) => a.address).join(', ')}
            </p>
            {m.cc.length > 0 && (
              <p className="mt-1 text-[10px] text-[#7187a9]">
                CC {m.cc.map((a) => a.address).join(', ')}
              </p>
            )}
            <p className="mt-1 text-[9px] text-[#7187a9]">
              {time(m.receivedAt)}
            </p>
          </div>
          <button
            aria-label="Toggle message star"
            className={m.isStarred ? 'text-amber-400' : 'text-slate-300'}
            onClick={() =>
              act(`/messages/${m._id}/star`, { value: !m.isStarred }, 'patch')
            }
          >
            <Star size={16} fill={m.isStarred ? 'currentColor' : 'none'} />
          </button>
        </div>
        {m.isDraft && (
          <button
            className={`${button} mt-4`}
            onClick={() => onCompose('draft')}
          >
            Edit Draft
          </button>
        )}
        {m.oversized && (
          <p className="my-4 rounded-lg bg-amber-50 p-3 text-xs">
            This message exceeds the ERP size limit. Open Hostinger webmail to
            read it.
          </p>
        )}
        {m.htmlBody && (
          <div className="my-4 flex flex-wrap gap-3 text-[10px] text-blue-600">
            <button onClick={() => setShowHtml((v) => !v)}>
              {showHtml ? 'Plain text' : 'Formatted email'}
            </button>
            {showHtml && (
              <button onClick={() => setRemote((v) => !v)}>
                {remote ? 'Block remote images' : 'Display remote images'}
              </button>
            )}
          </div>
        )}
        {showHtml ? (
          <State query={html}>
            {html.data && (
              <iframe
                title="Sanitized email body"
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
                className="mt-5 min-h-[410px] w-full border-0"
                srcDoc={`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${remote ? 'https: http:' : "'none'"}; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><style>body{font:13px/1.7 Arial;color:#20365f;overflow-wrap:anywhere}table{max-width:100%;border-collapse:collapse}td,th{padding:6px}img{max-width:100%;height:auto}a{color:#008aff}</style></head><body>${html.data.html}</body></html>`}
              />
            )}
          </State>
        ) : (
          <div className="my-7 min-h-56 whitespace-pre-wrap break-words text-[12px] leading-7 text-[#344b77]">
            {m.textBody ||
              'No plain-text body. Use Formatted email if available.'}
          </div>
        )}
        {m.attachments.length > 0 && (
          <div className="border-t border-[#e7eff8] pt-4">
            <h3 className="mb-3 text-xs font-semibold">
              {m.attachments.length} Attachments
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {m.attachments.map((a) => (
                <button
                  disabled={!can('download_attachment')}
                  key={a._id}
                  onClick={() => download(a)}
                  className="flex min-w-0 items-center gap-2 rounded-xl border border-[#e2edf7] p-3 text-left"
                >
                  <FileText size={23} className="shrink-0 text-[#008aff]" />
                  <span className="min-w-0">
                    <span className="block truncate text-[10px] font-semibold">
                      {a.fileName}
                    </span>
                    <span className="text-[9px] text-[#7e92af]">
                      {Math.ceil(a.size / 1024)} KB
                    </span>
                  </span>
                  <Download
                    size={12}
                    className="ml-auto shrink-0 text-blue-600"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 text-xs text-red-600">
            {error}
          </p>
        )}
        <div className="mt-5 flex gap-2 border-t border-[#e7eff8] pt-4">
          <input
            aria-label="Email labels"
            className={input}
            placeholder="Labels, comma separated"
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
          />
          <button
            className={`${input} !w-auto whitespace-nowrap text-blue-600`}
            onClick={() =>
              act(
                `/messages/${m._id}/labels`,
                {
                  labels: labels
                    .split(',')
                    .map((v) => v.trim())
                    .filter(Boolean),
                },
                'patch',
              )
            }
          >
            Save Labels
          </button>
        </div>
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-blue-600">
            Link ERP record privately
          </summary>
          <LinkForm message={m} act={act} />
        </details>
        <div className="mt-6 flex gap-3 rounded-xl border border-[#dfeaf5] bg-[#f8fcff] p-4">
          <Avatar value={account?.emailAddress} />
          <button
            className="flex-1 text-left text-xs text-[#8297b5]"
            disabled={!can('reply') || !access('REPLY')}
            onClick={() => onCompose('reply')}
          >
            Type a reply...
          </button>
          <Send size={20} className="text-[#008aff]" />
        </div>
        <div className="mt-4 2xl:hidden">
          <Related message={m} />
        </div>
      </div>
    </div>
  );
}
function LinkForm({ message, act }) {
  const [kind, setKind] = useState('project'),
    [value, setValue] = useState('');
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-3">
      <select
        className={input}
        value={kind}
        onChange={(e) => setKind(e.target.value)}
      >
        {['project', 'client', 'lead', 'quotation', 'invoice'].map((k) => (
          <option key={k}>{k}</option>
        ))}
      </select>
      <input
        aria-label="Link record ID"
        className={input}
        value={value}
        placeholder="Record ID from ERP URL"
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        className={button}
        disabled={!/^[a-f\d]{24}$/i.test(value)}
        onClick={() =>
          act(`/messages/${message._id}/link`, { links: { [kind]: value } })
        }
      >
        Link record
      </button>
    </div>
  );
}
function Related({ message }) {
  const query = useQuery({
    queryKey: ['mail', 'related', message._id],
    queryFn: () => get(`/messages/${message._id}/related`),
  });
  const routes = {
    project: '/projects/',
    client: '/crm/clients/',
    lead: '/crm/leads/',
    quotation: '/quotations/',
    invoice: '/finance/invoices/',
  };
  return (
    <div className="space-y-3">
      <section className={panel}>
        <h3 className="text-sm font-bold">Related To</h3>
        <State query={query}>
          {Object.entries(query.data || {}).map(([kind, r]) => (
            <div
              className="mt-3 rounded-xl border border-[#e2edf7] p-3"
              key={kind}
            >
              <p className="text-[9px] uppercase text-[#7388a9]">{kind}</p>
              <div className="mt-2 flex items-center gap-2">
                <FolderKanban size={19} className="text-blue-600" />
                <b className="text-xs">{r.name}</b>
              </div>
              {r.projectId && (
                <p className="mt-2 text-[9px] text-[#7388a9]">{r.projectId}</p>
              )}
              {r.email && (
                <p className="mt-2 break-words text-[10px] text-blue-600">
                  {r.email}
                </p>
              )}
              <Link
                className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[#edf8ff] p-2 text-[10px] text-blue-600"
                to={routes[kind] + r._id}
              >
                View {kind}
                <ChevronRight size={12} />
              </Link>
            </div>
          ))}
          {query.data && Object.keys(query.data).length === 0 && (
            <p className="mt-4 text-xs leading-5 text-slate-500">
              No authorized linked records.
            </p>
          )}
        </State>
      </section>
      <section className={panel}>
        <h3 className="text-sm font-bold">Email Activity</h3>
        <p className="mt-4 text-[10px] text-[#7187a9]">
          Email received · {time(message.receivedAt)}
        </p>
        {message.activity?.map((a) => (
          <p
            key={a._id}
            className="mt-3 border-l-2 border-[#a8dbff] pl-3 text-[10px] text-[#7187a9]"
          >
            {a.action.replace('mail.', '')} · {time(a.createdAt)}
          </p>
        ))}
      </section>
    </div>
  );
}
