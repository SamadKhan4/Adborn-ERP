import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ERPHeader from './components/layout/ERPHeader.jsx';
import HRMSLayout from './components/hrms/HRMSLayout.jsx';
import HRMSModulePage from './pages/hrms/HRMSModulePage.jsx';
import Employees from './pages/hrms/Employees.jsx';
import HolidayCalendar from './pages/hrms/HolidayCalendar.jsx';
import Payroll from './pages/hrms/Payroll.jsx';
import { api } from './services/api.js';
import { useAuthStore } from './store/authStore.js';

function LocationProbe() {
  return <span data-testid="route">{useLocation().pathname}</span>;
}

function mountWorkspace(path, page) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/hrms" element={<HRMSLayout />}>
            <Route
              path=":module"
              element={
                <>
                  {page}
                  <LocationProbe />
                </>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  useAuthStore
    .getState()
    .setSession({
      user: {
        name: 'Super Admin',
        role: 'super_admin',
        email: 'admin@example.test',
      },
      accessToken: 'test',
    });
  vi.spyOn(api, 'get').mockResolvedValue({
    data: { data: { items: [], pagination: { nextCursor: null } } },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('global HRMS tab targets the nested dashboard route', () => {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <ERPHeader />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole('link', { name: 'HRMS' }));
  expect(screen.getByTestId('route').textContent).toBe('/hrms/dashboard');
});

test('HRMS sidebar collapses and keeps icon links accessible', () => {
  mountWorkspace('/hrms/employees', <Employees />);
  expect(screen.queryByText('Salary Management')).toBeNull();
  expect(screen.queryByText('Training & Development')).toBeNull();
  fireEvent.click(
    screen.getByRole('button', { name: 'Collapse HRMS sidebar' }),
  );
  expect(
    screen.getByRole('button', { name: 'Expand HRMS sidebar' }),
  ).toBeTruthy();
  expect(
    screen.getAllByRole('link', { name: 'Employees' }).length,
  ).toBeGreaterThan(0);
});

test('mobile HRMS navigation opens as an accessible drawer', () => {
  mountWorkspace('/hrms/employees', <Employees />);
  fireEvent.click(screen.getByRole('button', { name: 'Open HRMS navigation' }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.click(
    screen.getByRole('button', { name: 'Close HRMS navigation' }),
  );
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('Add Employee requires an onboarding form', async () => {
  mountWorkspace('/hrms/employees', <Employees />);
  fireEvent.click(screen.getByRole('button', { name: 'Add Employee' }));
  expect(await screen.findByText('No onboarding form is ready.')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Open onboarding' })).toBeTruthy();
});

test('Add Employee fills details from the selected onboarded user and shows generated credentials', async () => {
  api.get.mockImplementation(async (url) =>
    url === '/hrms/onboarding'
      ? {
          data: {
            data: {
              items: [
                {
                  _id: 'onboarding-1',
                  title: 'Riya Shah',
                  department: 'graphics',
                  status: 'Unassigned',
                  data: {
                    personal: { email: 'riya@example.test' },
                    employment: { designation: 'Graphic Designer' },
                  },
                },
              ],
            },
          },
        }
      : { data: { data: { items: [], pagination: { nextCursor: null } } } },
  );
  const post = vi.spyOn(api, 'post').mockResolvedValue({
    data: {
      data: {
        employee: {
          name: 'Riya Shah',
          email: 'riya@example.test',
          department: 'graphics',
          role: 'team_leader',
        },
        profile: {
          employeeCode: 'ADB-EMP-0001',
          designation: 'Graphic Designer',
        },
      },
    },
  });
  mountWorkspace('/hrms/employees', <Employees />);
  fireEvent.click(screen.getByRole('button', { name: 'Add Employee' }));
  fireEvent.change(await screen.findByLabelText('Onboarding user'), {
    target: { value: 'onboarding-1' },
  });
  expect(screen.getByDisplayValue('riya@example.test')).toBeTruthy();
  expect(screen.getByDisplayValue('Graphic Designer')).toBeTruthy();
  expect(screen.getByDisplayValue('Graphics')).toBeTruthy();
  expect(screen.getByDisplayValue('Generated after creation')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Employee type'), {
    target: { value: 'team_leader' },
  });
  fireEvent.change(screen.getByLabelText('Employee temporary password'), {
    target: { value: 'EmployeePass123' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Create employee' }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(
      '/hrms/employees/from-onboarding/onboarding-1',
      { temporaryPassword: 'EmployeePass123', role: 'team_leader' },
    ),
  );
  expect(
    await screen.findByText('Riya Shah created successfully'),
  ).toBeTruthy();
  expect(screen.getByDisplayValue('ADB-EMP-0001')).toBeTruthy();
});

test('module shells search demo records without calling write APIs', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      data: {
        items: [
          {
            _id: 'resource-1',
            title: 'React Developer',
            department: 'web_dev',
            status: 'Open',
            data: { candidateCount: 18, stage: 'Interviewing' },
          },
          {
            _id: 'resource-2',
            title: 'Motion Designer',
            department: 'video_editing',
            status: 'Open',
            data: { candidateCount: 9, stage: 'New' },
          },
        ],
        pagination: { nextCursor: null },
      },
    },
  });
  const post = vi.spyOn(api, 'post');
  mountWorkspace('/hrms/recruitment', <HRMSModulePage />);
  expect(await screen.findByText('React Developer')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Search recruitment'), {
    target: { value: 'motion' },
  });
  await waitFor(() => expect(screen.getByText('Motion Designer')).toBeTruthy());
  expect(screen.queryByText('React Developer')).toBeNull();
  expect(post).not.toHaveBeenCalled();
});

test('leave management previews a request and requires a rejection reason', async () => {
  api.get.mockImplementation(async (url) =>
    url === '/departments'
      ? {
          data: {
            data: [{ id: 'graphics', name: 'Graphics', status: 'ACTIVE' }],
          },
        }
      : {
          data: {
            data: {
              items: [
                {
                  _id: '507f1f77bcf86cd799439011',
                  title: 'Casual leave',
                  employee: {
                    name: 'Riya Shah',
                    email: 'riya@example.test',
                    department: 'graphics',
                  },
                  department: 'graphics',
                  status: 'Pending',
                  data: {
                    leaveType: 'casual',
                    startDate: '2026-11-10T00:00:00.000Z',
                    endDate: '2026-11-11T00:00:00.000Z',
                    reason: 'Family appointment',
                  },
                },
              ],
              pagination: { nextCursor: null },
            },
          },
        },
  );
  const patch = vi
    .spyOn(api, 'patch')
    .mockResolvedValue({ data: { data: { status: 'Rejected' } } });
  mountWorkspace('/hrms/leave', <HRMSModulePage />);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Review Riya Shah leave' }),
  );
  expect(screen.getByText('Family appointment')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
  expect(screen.getByRole('alert').textContent).toMatch(/reason required/i);
  fireEvent.change(screen.getByLabelText('HR note / rejection reason'), {
    target: { value: 'Critical delivery is scheduled' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
  await waitFor(() =>
    expect(patch).toHaveBeenCalledWith(
      '/hrms/leaves/requests/507f1f77bcf86cd799439011/reject',
      { reason: 'Critical delivery is scheduled' },
    ),
  );
});

test('holiday calendar lets HR publish an office holiday from the full calendar', async () => {
  const existingDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-08`;
  api.get.mockResolvedValueOnce({
    data: {
      data: {
        items: [
          {
            _id: 'holiday-1',
            title: 'Diwali',
            status: 'Published',
            data: {
              date: `${existingDate}T00:00:00.000Z`,
              type: 'company',
              description: 'Office closed',
            },
          },
        ],
      },
    },
  });
  const post = vi
    .spyOn(api, 'post')
    .mockResolvedValue({ data: { data: { _id: 'holiday-2' } } });
  mountWorkspace('/hrms/holidays', <HolidayCalendar />);
  expect((await screen.findAllByText('Diwali')).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: 'Add holiday' }));
  fireEvent.change(screen.getByLabelText('Holiday name'), {
    target: { value: 'Foundation Day' },
  });
  fireEvent.change(screen.getByLabelText('Holiday type'), {
    target: { value: 'company' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Publish holiday' }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(
      '/hrms/holidays',
      expect.objectContaining({
        title: 'Foundation Day',
        status: 'Published',
        data: expect.objectContaining({ type: 'company' }),
      }),
    ),
  );
});

test('employee payroll auto-calculates leave deduction and allows manual payable amount', async () => {
  api.get.mockImplementation(async (url) => {
    if (url === '/hrms/employees')
      return {
        data: {
          data: {
            items: [
              {
                _id: '507f1f77bcf86cd799439012',
                name: 'Riya Shah',
                department: 'graphics',
              },
            ],
          },
        },
      };
    if (url === '/hrms/payroll/employee-payslips')
      return { data: { data: { items: [] } } };
    if (url === '/hrms/payroll/employee-calculation')
      return {
        data: {
          data: {
            employee: {
              _id: '507f1f77bcf86cd799439012',
              name: 'Riya Shah',
              department: 'graphics',
            },
            month: '2027-02',
            year: 2027,
            monthNumber: 2,
            daysInMonth: 28,
            baseAmount: 28000,
            perDayAmount: 1000,
            totalLeaveDays: 2,
            leaveDeduction: 2000,
            professionalTax: 200,
            autoPayableAmount: 25800,
            leaveBreakdown: [{ leaveType: 'casual', days: 2 }],
          },
        },
      };
    return { data: { data: { items: [] } } };
  });
  const post = vi
    .spyOn(api, 'post')
    .mockResolvedValue({
      data: { message: 'Salary slip published successfully' },
    });
  mountWorkspace('/hrms/payroll', <Payroll />);
  await screen.findByRole('option', { name: /Riya Shah/ });
  fireEvent.change(screen.getByLabelText('Payroll employee'), {
    target: { value: '507f1f77bcf86cd799439012' },
  });
  fireEvent.change(screen.getByLabelText('Salary month'), {
    target: { value: '2027-02' },
  });
  fireEvent.change(screen.getByLabelText('Monthly salary amount'), {
    target: { value: '28000' },
  });
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      '/hrms/payroll/employee-calculation',
      expect.objectContaining({
        params: expect.objectContaining({
          employeeId: '507f1f77bcf86cd799439012',
          month: '2027-02',
          baseAmount: 28000,
        }),
      }),
    ),
  );
  await waitFor(() =>
    expect(screen.getByLabelText('Final payable amount').value).toBe('25800'),
  );
  expect(screen.getAllByText(/₹2,000/).length).toBeGreaterThan(0);
  fireEvent.change(screen.getByLabelText('Final payable amount'), {
    target: { value: '25500' },
  });
  fireEvent.change(screen.getByLabelText('Payroll note'), {
    target: { value: 'Manual performance adjustment' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Publish salary slip' }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith('/hrms/payroll/employee-payslips', {
      employeeId: '507f1f77bcf86cd799439012',
      month: '2027-02',
      baseAmount: 28000,
      payableAmount: 25500,
      manualOverride: true,
      note: 'Manual performance adjustment',
    }),
  );
});

test('published employee salary slip has view and download actions', async () => {
  api.get.mockImplementation(async (url) => {
    if (url === '/hrms/employees')
      return {
        data: {
          data: {
            items: [
              {
                _id: '507f1f77bcf86cd799439012',
                name: 'Riya Shah',
                department: 'graphics',
              },
            ],
          },
        },
      };
    if (url === '/hrms/payroll/employee-payslips')
      return {
        data: {
          data: {
            items: [
              {
                payrollRun: {
                  _id: '507f1f77bcf86cd799439013',
                  title: 'March 2027',
                  status: 'Approved',
                  employee: {
                    _id: '507f1f77bcf86cd799439012',
                    name: 'Riya Shah',
                    department: 'graphics',
                  },
                  data: { year: 2027, month: 3 },
                },
                entry: {
                  _id: '507f1f77bcf86cd799439014',
                  employee: '507f1f77bcf86cd799439012',
                  employeeName: 'Riya Shah',
                  gross: 20000,
                  deductions: 0,
                  net: 20000,
                  snapshot: {
                    totalLeaveDays: 0,
                    leaveDeduction: 0,
                    professionalTax: 200,
                    autoPayableAmount: 19800,
                    manualAdjustment: 200,
                  },
                },
              },
            ],
          },
        },
      };
    if (url === '/hrms/payroll/employee-calculation')
      return {
        data: {
          data: {
            employee: {
              _id: '507f1f77bcf86cd799439012',
              name: 'Riya Shah',
              department: 'graphics',
            },
            month: '2027-03',
            year: 2027,
            monthNumber: 3,
            daysInMonth: 31,
            baseAmount: 20000,
            perDayAmount: 645.16,
            totalLeaveDays: 0,
            leaveDeduction: 0,
            professionalTax: 200,
            autoPayableAmount: 19800,
            leaveBreakdown: [],
          },
        },
      };
    return { data: { data: { items: [] } } };
  });
  mountWorkspace('/hrms/payroll', <Payroll />);
  expect(
    await screen.findByRole('button', { name: 'View Riya Shah payslip' }),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Download Riya Shah payslip' }),
  ).toBeTruthy();
  fireEvent.click(
    screen.getByRole('button', { name: 'Edit Riya Shah payslip' }),
  );
  await waitFor(() =>
    expect(screen.getByLabelText('Final payable amount').value).toBe('19800'),
  );
});
