import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Send, Paperclip, Save } from 'lucide-react';
import { api } from '../../services/api.js';
import HRMSDialog from '../hrms/HRMSDialog.jsx';
import {
  financeInput as input,
  financeButton as button,
} from '../finance/FinanceShared.jsx';
import { useDebounced } from '../crm/CRMShared.jsx';
const recipients = (value) =>
  String(value || '')
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
export default function MailCompose({
  accounts,
  account,
  source,
  mode = 'new',
  onClose,
}) {
  const isDraft = source?.isDraft && mode === 'draft';
  const own = account?.emailAddress;
  const replyTo = (source?.replyTo?.length ? source.replyTo : [source?.from])
    .filter(Boolean)
    .map((r) => r.address);
  const all = [
    ...new Set([
      ...replyTo,
      ...(source?.to || []).map((r) => r.address),
      ...(source?.cc || []).map((r) => r.address),
    ]),
  ].filter((v) => v !== own);
  const [form, setForm] = useState({
    mailAccountId: account?._id || '',
    to: isDraft
      ? source.to.map((r) => r.address).join(', ')
      : mode === 'reply-all'
        ? all.join(', ')
        : mode === 'reply'
          ? replyTo.join(', ')
          : '',
    cc: isDraft ? source.cc.map((r) => r.address).join(', ') : '',
    bcc: '',
    subject: isDraft
      ? source.subject
      : ['reply', 'reply-all'].includes(mode)
        ? `Re: ${source.subject.replace(/^re:\s*/i, '')}`
        : mode === 'forward'
          ? `Fwd: ${source.subject}`
          : '',
    text: isDraft ? source.textBody || '' : '',
    links: {},
    attachRecordPdf: false,
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [recordType, setRecordType] = useState('project');
  const [recordId, setRecordId] = useState('');
  const [key, setKey] = useState(() => crypto.randomUUID());
  const search = useDebounced(form.to.split(/[,;]/).pop()?.trim() || '');
  const contacts = useQuery({
    queryKey: ['mail', 'contacts', search],
    queryFn: () =>
      api
        .get('/mail/contacts', { params: { search } })
        .then((r) => r.data.data.items),
    enabled: search.length >= 2 && !search.includes('@'),
  });
  const cache = useQueryClient();
  const selected = accounts.find((a) => a._id === form.mailAccountId);
  const save = useMutation({
    mutationFn: async (draft) => {
      const values = {
        ...form,
        to: recipients(form.to),
        cc: recipients(form.cc),
        bcc: recipients(form.bcc),
        ...(isDraft ? { draftMessage: source._id } : {}),
      };
      if (recordId)
        values.links = {
          [recordType]: z
            .string()
            .regex(/^[a-f\d]{24}$/i, 'Choose a valid ERP record ID')
            .parse(recordId),
        };
      for (const e of [...values.to, ...values.cc, ...values.bcc])
        z.email().parse(e);
      if (!draft && !values.to.length)
        throw new Error('Add at least one recipient');
      if (!draft && !values.text.trim()) throw new Error('Write your message');
      const body = new FormData();
      body.append('payload', JSON.stringify(values));
      files.forEach((f) => body.append('attachments', f));
      const path = draft
        ? '/mail/drafts'
        : mode === 'reply' || mode === 'reply-all'
          ? `/mail/messages/${source._id}/${mode}`
          : mode === 'forward'
            ? `/mail/messages/${source._id}/forward`
            : '/mail/send';
      return api.post(path, body, {
        headers: { 'Idempotency-Key': key },
        timeout: 60000,
      });
    },
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ['mail'] });
      onClose({ saved: true });
    },
    onError: (e) => setError(e.response?.data?.error?.message || e.message),
  });
  const change = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setKey(crypto.randomUUID());
  };
  return (
    <HRMSDialog
      open
      onOpenChange={onClose}
      title={
        mode === 'new'
          ? 'New Message'
          : mode === 'draft'
            ? 'Edit Draft'
            : mode === 'forward'
              ? 'Forward Message'
              : 'Reply'
      }
      description="Send through your own work email or an explicitly assigned shared mailbox."
      wide
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(false);
        }}
      >
        <label className="block text-xs">
          From
          <select
            className={input}
            aria-label="From mailbox"
            value={form.mailAccountId}
            disabled={Boolean(source)}
            onChange={(e) => change('mailAccountId', e.target.value)}
          >
            {accounts
              .filter(
                (a) =>
                  a.isActive &&
                  a.permissions.includes(
                    mode.startsWith('reply')
                      ? 'REPLY'
                      : mode === 'forward'
                        ? 'FORWARD'
                        : 'SEND',
                  ),
              )
              .map((a) => (
                <option key={a._id} value={a._id}>
                  {a.displayName ? a.displayName + ' ' : ''}&lt;{a.emailAddress}
                  &gt;
                </option>
              ))}
          </select>
        </label>
        {['to', 'cc', 'bcc'].map((k) => (
          <label className="block text-xs" key={k}>
            {k.toUpperCase()}
            <input
              className={input}
              aria-label={k.toUpperCase()}
              placeholder="name@company.com, another@company.com"
              value={form[k]}
              onChange={(e) => change(k, e.target.value)}
            />
          </label>
        ))}
        {contacts.data?.length > 0 && (
          <div className="flex flex-wrap gap-2 text-[10px]">
            {contacts.data.map((c) => (
              <button
                type="button"
                className="rounded-lg bg-blue-50 px-2 py-1 text-blue-600"
                key={c.email}
                onClick={() =>
                  change(
                    'to',
                    [...recipients(form.to).slice(0, -1), c.email].join(', '),
                  )
                }
              >
                {c.name} · {c.email}
              </button>
            ))}
          </div>
        )}
        <label className="block text-xs">
          Subject
          <input
            aria-label="Subject"
            className={input}
            value={form.subject}
            maxLength={200}
            onChange={(e) => change('subject', e.target.value)}
          />
        </label>
        <label className="block text-xs">
          Message
          <textarea
            aria-label="Message"
            className={`${input} min-h-60`}
            value={form.text}
            maxLength={100000}
            onChange={(e) => change('text', e.target.value)}
            placeholder="Write your message..."
          />
        </label>
        {selected?.signature && (
          <p className="whitespace-pre-wrap border-t border-[#e7eff8] pt-3 text-xs text-slate-500">
            Signature: {selected.signature}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="cursor-pointer rounded-xl border border-[#dce7f0] px-3 py-2">
            <Paperclip size={14} className="mr-1 inline" />
            Attachments
            <input
              className="hidden"
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,.docx,.xlsx,.zip"
              onChange={(e) => {
                setFiles(Array.from(e.target.files));
                setKey(crypto.randomUUID());
              }}
            />
          </label>
          {files.map((f) => (
            <span key={f.name}>
              {f.name} ({Math.ceil(f.size / 1024)} KB)
            </span>
          ))}
        </div>
        <details className="rounded-xl border border-[#e7eff8] p-3 text-xs">
          <summary className="cursor-pointer">
            Link an ERP record / attach invoice or quotation PDF
          </summary>
          <p className="my-2 text-slate-500">
            Linking never grants other users access to this email.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              className={input}
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
            >
              {['project', 'client', 'lead', 'quotation', 'invoice'].map(
                (t) => (
                  <option key={t}>{t}</option>
                ),
              )}
            </select>
            <input
              className={input}
              aria-label="Related ERP record ID"
              placeholder="Record ID from ERP URL"
              value={recordId}
              onChange={(e) => {
                setRecordId(e.target.value);
                setKey(crypto.randomUUID());
              }}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.attachRecordPdf}
                onChange={(e) => change('attachRecordPdf', e.target.checked)}
              />
              Attach linked invoice / quotation PDF
            </label>
          </div>
        </details>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button className={button} disabled={save.isPending}>
            <Send size={15} />
            {save.isPending ? 'Saving...' : 'Send'}
          </button>
          <button
            type="button"
            className={`${input} !w-auto`}
            disabled={save.isPending}
            onClick={() => save.mutate(true)}
          >
            <Save size={14} className="mr-2 inline" />
            Save Draft
          </button>
          <button
            type="button"
            className="text-xs text-slate-500"
            disabled={save.isPending}
            onClick={onClose}
          >
            Discard
          </button>
        </div>
      </form>
    </HRMSDialog>
  );
}
