import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Reports from './pages/Reports.jsx';
import ReportLibrary from './components/reports/ReportLibrary.jsx';
import { api } from './services/api.js';
import { useAuthStore } from './store/authStore.js';
import { datePreset } from './components/reports/ReportShared.jsx';
const task = {
  key: 'task_summary',
  category: 'projects',
  title: 'Task Summary',
  description: 'Own tasks',
  permission: 'reports.projects.view',
  columns: ['taskId', 'title', 'status'],
  exportOptions: ['csv', 'xlsx', 'pdf'],
  scope: 'OWN',
  canExport: true,
};
const catalog = {
  items: [task],
  categories: [
    {
      key: 'projects',
      title: 'Project Reports',
      description: 'Scoped projects',
      count: 1,
      saved: 0,
    },
  ],
  departments: [{ key: 'web_dev', name: 'Web Development' }],
  summary: { total: 1, scheduled: 0, generated: 0, modules: 1 },
  recent: [],
  permissions: [
    'reports.view',
    'reports.projects.view',
    'reports.generate',
    'reports.export',
    'reports.projects.export',
    'reports.manage_templates',
    'reports.schedule',
  ],
};
const detail = {
  report: task,
  scope: 'OWN',
  filters: {},
  summary: { records: 1 },
  rows: [{ taskId: 'T1', title: 'My real task', status: 'DONE' }],
  chart: [],
  pagination: { page: 1, total: 1, totalPages: 1 },
  dateBasis: 'Created date',
};
function mount(path = '/reports') {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={[path]}>
        <Reports />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  useAuthStore.setState({
    user: { id: 'employee1', role: 'employee', email: 'employee@example.test' },
  });
  vi.spyOn(api, 'get').mockImplementation(async (url) => ({
    data: {
      data:
        url === '/reports/task_summary'
          ? detail
          : url === '/reports/saved'
            ? []
            : catalog,
    },
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useAuthStore.getState().clearAuth();
});
test('landing shows only server-authorized categories, metrics and navigation', async () => {
  mount();
  expect(await screen.findByText('Scoped projects')).toBeTruthy();
  expect(screen.queryByText('Finance Reports')).toBeNull();
  expect(screen.queryByText('HR Reports')).toBeNull();
  expect(screen.getByRole('button', { name: /Generate Report/ })).toBeTruthy();
  fireEvent.change(screen.getByPlaceholderText('Search reports'), {
    target: { value: 'task' },
  });
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      '/reports',
      expect.objectContaining({
        params: expect.objectContaining({ search: 'task' }),
      }),
    ),
  );
});
test('detail sends filters/sort to backend and can save configuration', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
  mount('/reports/projects/task_summary');
  expect(await screen.findByText('My real task')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Search report data'), {
    target: { value: 'real' },
  });
  fireEvent.change(screen.getByLabelText('Department'), {
    target: { value: 'web_dev' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      '/reports/task_summary',
      expect.objectContaining({
        params: expect.objectContaining({
          search: 'real',
          department: 'web_dev',
          page: 1,
        }),
      }),
    ),
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Save View' }));
  fireEvent.change(screen.getByLabelText('Report name'), {
    target: { value: 'My saved tasks' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save view' }));
  await screen.findByText('Report view saved.');
  expect(post).toHaveBeenCalledWith(
    '/reports/saved',
    expect.objectContaining({
      reportKey: 'task_summary',
      name: 'My saved tasks',
      filters: expect.objectContaining({ department: 'web_dev' }),
    }),
  );
});
test('unavailable source explains limitation and offers no export/schedule', async () => {
  api.get.mockImplementation(async (url) => ({
    data: {
      data:
        url === '/reports/expense_register'
          ? {
              ...detail,
              report: { ...task, key: 'expense_register' },
              unavailable: 'No expense ledger exists',
              rows: [],
            }
          : catalog,
    },
  }));
  mount('/reports/finance/expense_register');
  expect(await screen.findByText('No expense ledger exists')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Export' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Schedule Report' })).toBeNull();
});
test('direct unauthorized report requests display the backend denial', async () => {
  api.get.mockImplementation(async (url) => {
    if (url === '/reports/payroll_summary')
      throw {
        response: {
          status: 403,
          data: {
            error: {
              message: 'You do not have permission to view this report',
            },
          },
        },
      };
    return { data: { data: catalog } };
  });
  mount('/reports/hr/payroll_summary');
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    expect.stringContaining('You do not have permission'),
  );
});
test('schedule dialog uses account recipient and creates a live schedule', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
  mount('/reports/projects/task_summary');
  await screen.findByText('My real task');
  fireEvent.click(screen.getByRole('button', { name: 'Schedule Report' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save schedule' }));
  await screen.findByText('Scheduled report saved.');
  expect(post).toHaveBeenCalledWith(
    '/reports/scheduled',
    expect.objectContaining({
      recipients: ['employee@example.test'],
      reportKey: 'task_summary',
      frequency: 'DAILY',
    }),
  );
});
test('date presets are deterministic in IST and calculate financial year/last month', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T20:00:00Z'));
  expect(datePreset('today')).toEqual({ from: '2026-01-02', to: '2026-01-02' });
  expect(datePreset('financial-year').from).toBe('2025-04-01');
  expect(datePreset('last-month')).toEqual({
    from: '2025-12-01',
    to: '2025-12-31',
  });
  vi.useRealTimers();
});
test('compact library exposes pagination, availability control and friendly scope labels', () => {
  const onPage = vi.fn(),
    onAvailability = vi.fn();
  render(
    <MemoryRouter>
      <ReportLibrary
        items={[task]}
        categories={catalog.categories}
        pagination={{ total: 28, totalPages: 3, limit: 12 }}
        page={1}
        onPage={onPage}
        sort="recommended"
        onSort={vi.fn()}
        availableOnly
        onAvailability={onAvailability}
        reportPath={() => '/reports/projects/task_summary'}
        busy={false}
        onReset={vi.fn()}
      />
    </MemoryRouter>,
  );
  expect(screen.getByText('Showing 1–12 of 28 reports')).toBeTruthy();
  expect(screen.getByText('My records')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Next reports' }));
  expect(onPage).toHaveBeenCalledWith(2);
  fireEvent.click(screen.getByLabelText('Available only'));
  expect(onAvailability).toHaveBeenCalledWith(false);
  expect(
    screen.getByRole('link', { name: /Task Summary/ }).getAttribute('href'),
  ).toBe('/reports/projects/task_summary');
});
