import React from 'react';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MailWorkspace from './pages/MailWorkspace.jsx';
import MailCompose from './components/mail/MailCompose.jsx';
import { api } from './services/api.js';
import { useAuthStore } from './store/authStore.js';
const account = {
  _id: 'a'.repeat(24),
  emailAddress: 'employee@adbornsolutions.com',
  type: 'PERSONAL',
  displayName: 'Employee',
  isActive: true,
  syncStatus: 'CONNECTED',
  permissions: ['READ', 'SEND', 'REPLY', 'FORWARD', 'ARCHIVE', 'TRASH'],
};
const message = {
  _id: 'b'.repeat(24),
  mailAccount: account._id,
  subject: 'Actual private work email',
  from: { name: 'Actual Client', address: 'client@example.test' },
  to: [{ address: account.emailAddress }],
  cc: [],
  bcc: [],
  replyTo: [],
  snippet: 'Actual message',
  textBody: 'Live private message body',
  htmlBody: '<p>Live message</p>',
  attachments: [],
  labels: [],
  threadKey: 'c'.repeat(64),
  receivedAt: '2026-10-17T06:00:00Z',
  isRead: true,
  isStarred: false,
  activity: [],
};
function mount(ui = <MailWorkspace />, path = '/mail/inbox') {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  useAuthStore.setState({
    user: {
      _id: 'd'.repeat(24),
      name: 'Employee',
      email: account.emailAddress,
      role: 'employee',
      permissions: ['mail.use'],
    },
  });
  vi.spyOn(api, 'get').mockImplementation(async (url) => ({
    data: {
      data:
        url === '/mail/accounts'
          ? { items: [account], permissions: ['*'], configured: true }
          : url === '/mail/messages'
            ? {
                items: [message],
                page: 1,
                total: 1,
                totalPages: 1,
                counts: [{ _id: 'INBOX', total: 1, unread: 0 }],
              }
            : url.endsWith('/related')
              ? {}
              : url.endsWith('/html')
                ? { html: '<p>Live message</p>' }
                : url === '/mail/jobs'
                  ? { items: [] }
                  : url.includes('/messages/')
                    ? message
                    : { items: [] },
    },
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test('reference-style inbox renders actual messages and mailbox counts without demo content', async () => {
  mount();
  expect(await screen.findByText('Actual private work email')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Compose' })).toBeTruthy();
  expect(screen.queryByText('ABC Pvt Ltd')).toBeNull();
  expect(
    screen.getByRole('button', { name: account.emailAddress }),
  ).toBeTruthy();
});
test('work email is prefilled and editable before provider verification', async () => {
  api.get.mockResolvedValue({
    data: {
      data: {
        items: [],
        permissions: ['mail.use', 'mail.personal.connect'],
        configured: true,
      },
    },
  });
  mount();
  expect(await screen.findByText('Connect Your Work Email')).toBeTruthy();
  const email = screen.getByDisplayValue(account.emailAddress);
  expect(email.readOnly).toBe(false);
  expect(screen.getByLabelText('Mailbox password').type).toBe('password');
});
test('reader renders plain text; HTML and remote images require explicit opt-in', async () => {
  mount(<MailWorkspace />, `/mail/message/${message._id}`);
  expect(await screen.findByText('Live private message body')).toBeTruthy();
  expect(screen.queryByTitle('Sanitized email body')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Formatted email' }));
  expect(await screen.findByTitle('Sanitized email body')).toBeTruthy();
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      `/mail/messages/${message._id}/html`,
      expect.objectContaining({ params: { remote: 'false' } }),
    ),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Display remote images' }),
  );
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      `/mail/messages/${message._id}/html`,
      expect.objectContaining({ params: { remote: 'true' } }),
    ),
  );
});
test('compose submits mailbox identity and stable send key without arbitrary From', async () => {
  const post = vi
    .spyOn(api, 'post')
    .mockResolvedValue({ data: { data: { status: 'PENDING' } } });
  const close = vi.fn();
  mount(<MailCompose accounts={[account]} account={account} onClose={close} />);
  fireEvent.change(screen.getByLabelText('To'.toUpperCase()), {
    target: { value: 'client@example.test' },
  });
  fireEvent.change(screen.getByLabelText('Subject'), {
    target: { value: 'Actual update' },
  });
  fireEvent.change(screen.getByLabelText('Message'), {
    target: { value: 'Actual content' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await waitFor(() => expect(post).toHaveBeenCalled());
  const [path, body, options] = post.mock.calls[0];
  expect(path).toBe('/mail/send');
  const payload = JSON.parse(body.get('payload'));
  expect(payload.mailAccountId).toBe(account._id);
  expect(payload.from).toBeUndefined();
  expect(options.headers['Idempotency-Key']).toMatch(/^[\w-]{16,}/);
  expect(close).toHaveBeenCalledWith({ saved: true });
});
test('known unauthorized message IDs show permission errors without rendering any private body', async () => {
  api.get.mockImplementation(async (url) => {
    if (url.includes(`/messages/${message._id}`))
      throw {
        response: {
          data: {
            error: { message: 'You do not have access to this mailbox.' },
          },
        },
      };
    return {
      data: {
        data:
          url === '/mail/accounts'
            ? { items: [account], permissions: ['mail.use'] }
            : url === '/mail/messages'
              ? { items: [], total: 0, totalPages: 0, counts: [] }
              : { items: [] },
      },
    };
  });
  mount(<MailWorkspace />, `/mail/message/${message._id}`);
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    expect.stringContaining('You do not have access'),
  );
  expect(screen.queryByText('Live private message body')).toBeNull();
});
