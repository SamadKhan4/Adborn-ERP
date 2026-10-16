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
import { api } from './services/api.js';
import { useAuthStore } from './store/authStore.js';
import UserManagement from './pages/UserManagement.jsx';
import Employees from './pages/hrms/Employees.jsx';
import DeleteAccountDialog from './components/hrms/DeleteAccountDialog.jsx';
vi.mock('react-router-dom', async (load) => ({
  ...(await load()),
  useOutletContext: () => ({ openHRMSNavigation: vi.fn() }),
}));
const account = {
  _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  name: 'Inactive HR',
  email: 'inactive@example.test',
  role: 'hr',
  active: false,
};
function mount(content) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <MemoryRouter>{content}</MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  useAuthStore.getState().setSession({
    user: {
      id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      name: 'Admin',
      role: 'admin',
      permissions: ['users.manage', 'hrms.read'],
    },
    accessToken: 'test',
  });
  vi.spyOn(api, 'get').mockImplementation(async (url) => ({
    data: {
      data:
        url === '/departments'
          ? [{ id: 'web_dev', name: 'Web Development', status: 'ACTIVE' }]
          : { items: [account], pagination: {} },
    },
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test.each([
  [UserManagement, '/user-management'],
  [Employees, '/hrms/employees'],
])(
  'permanent delete is available for inactive accounts with typed email confirmation',
  async (Page, endpoint) => {
    const remove = vi.spyOn(api, 'delete').mockResolvedValue({
      data: { success: true, data: { cleanupPending: 0 } },
    });
    mount(<Page />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete Inactive HR' }),
    );
    const confirm = screen.getByRole('button', { name: 'Delete permanently' });
    expect(confirm.disabled).toBe(true);
    expect(remove).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Confirm deletion email'), {
      target: { value: account.email },
    });
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(remove).toHaveBeenCalledWith(
        `${endpoint}/${account._id}/permanent`,
        { data: { confirmation: account.email }, timeout: 120000 },
      ),
    );
  },
);
test('failed delete stays open with the server error; pending disk cleanup is explained', async () => {
  const close = vi.fn();
  const remove = vi
    .spyOn(api, 'delete')
    .mockRejectedValueOnce({
      response: {
        data: { error: { message: 'You cannot delete this account' } },
      },
    })
    .mockResolvedValue({ data: { data: { cleanupPending: 1 } } });
  mount(
    <DeleteAccountDialog
      account={account}
      endpoint="/user-management"
      onClose={close}
    />,
  );
  fireEvent.change(screen.getByLabelText('Confirm deletion email'), {
    target: { value: account.email },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Delete permanently' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Delete permanently' }));
  expect((await screen.findByRole('status')).textContent).toContain(
    'queued for automatic cleanup',
  );
  expect(remove).toHaveBeenCalledTimes(2);
});

test.each([
  [UserManagement, '/user-management'],
  [Employees, '/hrms/employees'],
])(
  'inactive account can be reactivated through its authorized endpoint',
  async (Page, endpoint) => {
    const update = vi
      .spyOn(api, 'patch')
      .mockResolvedValue({ data: { data: { ...account, active: true } } });
    mount(<Page />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Reactivate Inactive HR' }),
    );
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(`${endpoint}/${account._id}`, {
        active: true,
      }),
    );
  },
);
test('managed user summary cards and role filter narrow the visible accounts', async () => {
  api.get.mockResolvedValue({
    data: {
      data: {
        items: [
          account,
          {
            ...account,
            _id: 'cccccccccccccccccccccccc',
            name: 'Active Manager',
            role: 'manager',
            active: true,
          },
        ],
      },
    },
  });
  mount(<UserManagement />);
  await screen.findByText('Active Manager');
  fireEvent.click(screen.getByRole('button', { name: /^Active users/ }));
  expect(screen.queryByText('Inactive HR')).toBeNull();
  fireEvent.change(screen.getByLabelText('Managed user role filter'), {
    target: { value: 'hr' },
  });
  expect(screen.getByText('No managed users found.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByText('Inactive HR')).toBeTruthy();
});
test('employee search and status filters request server-wide matching records', async () => {
  mount(<Employees />);
  await screen.findByText('Inactive HR');
  fireEvent.change(screen.getByLabelText('Search employees'), {
    target: { value: 'Directory' },
  });
  fireEvent.change(screen.getByLabelText('Employee status filter'), {
    target: { value: 'false' },
  });
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      '/hrms/employees',
      expect.objectContaining({
        params: { search: 'Directory', active: 'false' },
      }),
    ),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Clear directory filters' }),
  );
  expect(screen.getByLabelText('Search employees').value).toBe('');
});
