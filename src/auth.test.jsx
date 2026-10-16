import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { api } from './services/api.js';
import { useAuthStore } from './store/authStore.js';
import { authService } from './services/authService.js';
const session = {
  user: { name: 'Test Admin', role: 'admin' },
  accessToken: 'test-access',
};
function mount(path = '/') {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  useAuthStore.getState().clearAuth();
  vi.spyOn(api, 'get').mockImplementation((url) => {
    const fixtures = {
      '/user-management': { items: [] },
      '/departments': [],
      '/notifications': { items: [], unreadCount: 0 },
      '/hrms/employee-dashboard': {
        employee: { name: 'Test Employee', role: 'employee', profile: {} },
        todayAttendance: null, dailyReport: null, dailyReports: [],
        recentAttendance: [], leaveBalances: [], holidays: [],
        upcomingHolidays: [], payslips: [], announcements: [],
        leaveRequests: [], assets: [], tasks: [],
      },
      '/team/my-work': { leader: null, tasks: [], standup: null, summary: [], pagination: {} },
      '/dashboard/overview': {
        date: '2026-10-16', generatedAt: new Date().toISOString(),
        finance: { paid: 0, outstanding: 0, overdue: 0, overdueCount: 0 },
        projects: {}, attendance: { employees: 0, present: 0, percent: 0, notCheckedIn: 0, reports: 0 },
        pendingLeaves: 0, overdueFollowups: 0, taskSummary: {}, revenue: [],
        leads: {}, clients: 0, invoices: [], tasks: [], activities: [],
      },
    };
    return Promise.resolve({ data: { data: fixtures[url] ?? { database: 'connected' } } });
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test('protected entry redirects to login and successful login opens the protected page', async () => {
  const post = vi
    .spyOn(api, 'post')
    .mockResolvedValue({ data: { data: session } });
  mount();
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'admin@example.test' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'StrongPassword123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
  const userManagementLink = await screen.findByRole('link', {
    name: 'User Management',
  });
  expect(post).toHaveBeenCalledWith('/auth/login', {
    email: 'admin@example.test',
    password: 'StrongPassword123',
  });
  fireEvent.click(userManagementLink);
  await waitFor(() =>
    expect(userManagementLink.getAttribute('aria-current')).toBe('page'),
  );
});
test('invalid login remains on the form with an error', async () => {
  vi.spyOn(api, 'post').mockRejectedValue({
    response: { data: { error: { message: 'Invalid email or password' } } },
  });
  mount('/login');
  fireEvent.submit(
    screen.getByRole('button', { name: 'Log in' }).closest('form'),
  );
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Invalid email or password',
  );
  expect(useAuthStore.getState().user).toBeNull();
});
test.each(['employee', 'executive', 'team_leader'])('%s login records attendance and opens the employee workspace', async (role) => {
  const employeeSession = {
    user: {
      name: 'Test Employee',
      role,
      permissions: ['dashboard.view', 'hrms.self'],
    },
    accessToken: 'employee-access',
  };
  const post = vi
    .spyOn(api, 'post')
    .mockResolvedValueOnce({ data: { data: employeeSession } })
    .mockResolvedValueOnce({ data: { success: true } });
  mount('/login');
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'employee@example.test' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'EmployeePassword123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith('/hrms/attendance/check-in', {}),
  );
  expect(
    (await screen.findByRole('link', { name: 'My Dashboard' }, { timeout: 4000 })).getAttribute(
      'href',
    ),
  ).toBe('/employee');
});
test('restores an existing refresh-cookie session before rendering protected content', async () => {
  useAuthStore.setState({ isInitialized: false });
  const post = vi
    .spyOn(api, 'post')
    .mockResolvedValue({ data: { data: session } });
  mount();
  expect(
    await screen.findByRole(
      'heading',
      { name: 'Dashboard', level: 1 },
      { timeout: 4000 },
    ),
  ).toBeTruthy();
  expect(post).toHaveBeenCalledWith('/auth/refresh');
});
test('page reload restores the saved access token without rotating the refresh cookie', async () => {
  useAuthStore.getState().setSession(session);
  const saved = localStorage.getItem('adborn-auth');
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isInitialized: false,
  });
  localStorage.setItem('adborn-auth', saved);
  await useAuthStore.persist.rehydrate();
  expect(useAuthStore.getState().isInitialized).toBe(false);
  const get = vi
    .spyOn(api, 'get')
    .mockResolvedValue({ data: { data: session.user } });
  const post = vi.spyOn(api, 'post');
  await authService.restoreSession();
  expect(get).toHaveBeenCalledWith('/auth/me');
  expect(post).not.toHaveBeenCalled();
  expect(useAuthStore.getState().accessToken).toBe(session.accessToken);
  expect(useAuthStore.getState().isInitialized).toBe(true);
});

test('logout revokes the session and redirects to login', async () => {
  useAuthStore.getState().setSession(session);
  const post = vi
    .spyOn(api, 'post')
    .mockResolvedValue({ data: { success: true } });
  mount('/logout');
  fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Log in' })).toBeTruthy(),
  );
  expect(post).toHaveBeenCalledWith('/auth/logout');
  expect(useAuthStore.getState().accessToken).toBeNull();
});
test('failed logout keeps the session available for retry', async () => {
  useAuthStore.getState().setSession(session);
  vi.spyOn(api, 'post').mockRejectedValue(new Error('Network failure'));
  mount('/logout');
  fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(useAuthStore.getState().user).toEqual(session.user);
});
test('password visibility can be toggled without submitting the form', () => {
  mount('/login');
  expect(screen.getByLabelText('Password').type).toBe('password');
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText('Password').type).toBe('text');
  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(screen.getByLabelText('Password').type).toBe('password');
});
test('forgot password uses the backend and shows its generic delivery response', async () => {
  const message =
    'If the account exists, reset instructions will be delivered.';
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { message } });
  mount('/login');
  fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.test' },
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Send reset instructions' }),
  );
  expect(await screen.findByText(message)).toBeTruthy();
  expect(post).toHaveBeenCalledWith('/auth/forgot-password', {
    email: 'test@example.test',
  });
  fireEvent.click(screen.getByRole('button', { name: 'Back to sign in' }));
  expect(screen.getByLabelText('Password')).toBeTruthy();
});
