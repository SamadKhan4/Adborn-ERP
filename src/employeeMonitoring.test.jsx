import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EmployeeMonitoring from './pages/hrms/EmployeeMonitoring.jsx';
import { api } from './services/api.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function mount() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={['/hrms/employees/employee-id/monitoring']}>
        <Routes>
          <Route element={<Outlet context={{ openHRMSNavigation: vi.fn() }} />}>
            <Route
              path="/hrms/employees/:id/monitoring"
              element={<EmployeeMonitoring />}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

test('renders employee reports and switches monitoring period', async () => {
  const get = vi.spyOn(api, 'get').mockResolvedValue({
    data: {
      data: {
        employee: {
          name: 'Riya Shah',
          email: 'riya@example.test',
          role: 'employee',
          active: true,
          profile: { employeeCode: 'ADB-EMP-1000' },
        },
        generatedAt: new Date().toISOString(),
        summary: {
          todayStatus: 'Checked in',
          attendanceDays: 1,
          reportedDays: 1,
          workedMinutes: 125,
          missingReports: 0,
        },
        attendance: [],
        reports: [
          {
            _id: 'report-1',
            title: 'Today report',
            status: 'Submitted',
            data: {
              summary: 'Completed client design',
              blockers: 'Waiting for client approval',
              completedTasks: ['Prepared draft'],
            },
          },
        ],
        leaves: [],
        assets: [],
        performance: [],
      },
    },
  });
  mount();
  expect(
    await screen.findByRole('heading', { name: 'Riya Shah' }),
  ).toBeTruthy();
  expect(
    screen.getByText('Waiting for client approval', { exact: false }),
  ).toBeTruthy();
  expect(screen.getByText('2h 5m')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Monitoring period'), {
    target: { value: '7' },
  });
  await waitFor(() =>
    expect(get).toHaveBeenLastCalledWith(
      '/hrms/employees/employee-id/monitoring',
      expect.objectContaining({ params: { days: 7 } }),
    ),
  );
});

test('shows an actionable error when monitoring access is denied', async () => {
  vi.spyOn(api, 'get').mockRejectedValue({
    response: {
      status: 403,
      data: { error: { message: 'Employee monitoring access required' } },
    },
  });
  mount();
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    expect.stringContaining('Employee monitoring access required'),
  );
  expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
});
