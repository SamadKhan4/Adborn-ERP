import * as exportTools from './lib/dashboardExport.js';
import React from 'react';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import RecentInvoices from './components/dashboard/RecentInvoices.jsx';
import ERPHeader from './components/layout/ERPHeader.jsx';
import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';
import { useAuthStore } from './store/authStore.js';
import { api } from './services/api.js';

function renderHeader(children = <ERPHeader />) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.getState().setSession({
    user: {
      name: 'Test Admin',
      email: 'test@example.test',
      role: 'super_admin',
    },
    accessToken: 'test',
  });
  vi.spyOn(api, 'get').mockResolvedValue({
    data: { data: { items: [], unreadCount: 0 } },
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test('invoice search and status filter use supplied backend records', () => {
  render(
    <MemoryRouter>
      <RecentInvoices
        invoices={[
          {
            _id: 'one',
            invoiceNumber: 'LIVE-1',
            client: { company: 'Real Client' },
            grandTotal: 2000,
            status: 'Paid',
          },
          {
            _id: 'two',
            invoiceNumber: 'LIVE-2',
            client: { company: 'Another Client' },
            grandTotal: 3000,
            status: 'Sent',
          },
        ]}
      />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText('Search recent invoices'), {
    target: { value: 'Real Client' },
  });
  expect(screen.getByText('LIVE-1')).toBeTruthy();
  expect(screen.queryByText('LIVE-2')).toBeNull();
  fireEvent.change(screen.getByLabelText('Invoice status'), {
    target: { value: 'Sent' },
  });
  expect(screen.getByText('No invoices match your filters.')).toBeTruthy();
});
test('profile menu shows authenticated user and logout; Escape closes it', () => {
  renderHeader();
  fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' }));
  expect(screen.getByText('test@example.test')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Log out' })).toBeTruthy();
  fireEvent.keyDown(screen.getByRole('button', { name: 'Open profile menu' }), {
    key: 'Escape',
  });
  expect(screen.queryByText('test@example.test')).toBeNull();
});
test('ungranted modules and overview remain hidden for employees', () => {
  useAuthStore.setState({ user: { name: 'Employee', role: 'employee' } });
  renderHeader();
  expect(screen.queryByRole('link', { name: 'Overview' })).toBeNull();
  expect(screen.queryByRole('link', { name: 'Invoices' })).toBeNull();
});
test('HR sees HRMS, Employee Management and Departments without CRM access', () => {
  useAuthStore.setState({
    user: {
      name: 'HR User',
      role: 'hr',
      permissions: [
        'dashboard.view',
        'users.read',
        'users.manage',
        'hrms.read',
        'hrms.manage',
        'hrms.approve',
        'hrms.payroll.read',
      ],
    },
  });
  renderHeader();
  const links = screen
    .getByRole('navigation', { name: 'Primary navigation' })
    .querySelectorAll('a');
  expect([...links].map((link) => link.textContent.trim())).toEqual([
    'HRMS',
    'Employee Management',
    'Departments',
    'Mail',
  ]);
});

test('Team Leader sees employee dashboard and team tools without CRM or HRMS even with stale grants', () => {
  useAuthStore.setState({
    user: {
      name: 'Team Leader',
      role: 'team_leader',
      permissions: [
        'dashboard.view',
        'hrms.self',
        'hrms.read',
        'crm.leads.view',
        'crm.dashboard.view',
        'team.workspace.view',
      ],
    },
  });
  renderHeader();
  expect(
    screen.getByRole('link', { name: 'My Dashboard' }).getAttribute('href'),
  ).toBe('/employee');
  expect(screen.getByRole('link', { name: 'Team Workspace' })).toBeTruthy();
  expect(screen.queryByRole('link', { name: 'HRMS' })).toBeNull();
  expect(screen.queryByRole('link', { name: 'CRM' })).toBeNull();
});
function RouteProbe() {
  const location = useLocation();
  return <p data-testid="current-route">{location.pathname}</p>;
}
test('dragging the header scrolls tabs and suppresses accidental mouse selection', () => {
  renderHeader(
    <>
      <ERPHeader />
      <RouteProbe />
    </>,
  );
  const nav = screen.getByRole('navigation', { name: 'Primary navigation' });
  nav.scrollLeft = 200;
  const pointer = (type, x) => {
    const event = new MouseEvent(type, {
      bubbles: true,
      clientX: x,
      button: 0,
    });
    Object.defineProperty(event, 'pointerType', { value: 'mouse' });
    Object.defineProperty(event, 'pointerId', { value: 1 });
    fireEvent(nav, event);
  };
  pointer('pointerdown', 200);
  pointer('pointermove', 140);
  expect(nav.scrollLeft).toBe(260);
  expect(nav.style.cursor).toBe('grabbing');
  pointer('pointerup', 140);
  fireEvent.click(screen.getByRole('link', { name: 'CRM' }), { detail: 1 });
  expect(screen.getByTestId('current-route').textContent).toBe('/');
  fireEvent.click(screen.getByRole('link', { name: 'CRM' }), { detail: 0 });
  expect(screen.getByTestId('current-route').textContent).toBe('/crm');
});

test('employee dashboard tabs open every self-service section', async () => {
  useAuthStore.setState({
    user: { name: 'Riya Shah', role: 'employee', email: 'riya@example.test' },
  });
  api.get.mockResolvedValue({
    data: {
      data: {
        employee: {
          name: 'Riya Shah',
          email: 'riya@example.test',
          role: 'employee',
          department: 'graphics',
          profile: {
            employeeCode: 'ADB-EMP-0001',
            designation: 'Designer',
            employmentType: 'full_time',
            address: { current: 'Mumbai' },
          },
        },
        todayAttendance: null,
        dailyReport: null,
        dailyReports: [],
        recentAttendance: [],
        leaveBalances: [],
        holidays: [],
        upcomingHolidays: [],
        payslips: [],
        announcements: [],
        leaveRequests: [],
        assets: [],
        tasks: [],
      },
    },
  });
  const scrollIntoView = vi.fn();
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  });
  renderHeader(<EmployeeDashboard />);
  await screen.findAllByRole('button', { name: 'My Assets' });
  expect(screen.getAllByTestId('workflow-connector')).toHaveLength(2);

  const tabs = [
    ['My Attendance', 'attendance'],
    ['My Daily Report', 'daily-reports'],
    ['My Leaves', 'leave-requests'],
    ['My Payslips', 'payslips'],
    ['Holiday Calendar', 'holidays'],
    ['My Profile', 'profile'],
    ['My Assets', 'assets'],
    ['My Tasks', 'tasks'],
    ['Announcements', 'announcements'],
  ];
  for (const [label, id] of tabs) {
    const tab = screen.getAllByRole('button', { name: label })[0];
    fireEvent.click(tab);
    expect(tab.getAttribute('aria-current')).toBe('page');
    expect(document.getElementById(id)).toBeTruthy();
    expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(2);
  }

  expect(document.getElementById('profile')).toBeFalsy();
  fireEvent.click(screen.getAllByRole('button', { name: 'My Profile' })[0]);
  expect(screen.getByText('ADB-EMP-0001')).toBeTruthy();
});

vi.mock('./components/dashboard/RevenueChart.jsx', () => ({
  default: () => <div>Invoice Trend</div>,
}));
const overviewFixture = {
  date: '2026-10-16',
  generatedAt: new Date().toISOString(),
  finance: { paid: 12345, outstanding: 2500, overdue: 500, overdueCount: 1 },
  projects: { Active: 3, Planned: 2 },
  attendance: {
    employees: 10,
    present: 8,
    percent: 80,
    notCheckedIn: 2,
    reports: 6,
  },
  pendingLeaves: 2,
  overdueFollowups: 4,
  taskSummary: { BLOCKED: 1, DONE: 5 },
  revenue: [],
  leads: { NEW: 7 },
  clients: 9,
  invoices: [],
  tasks: [],
  activities: [],
};
test('admin overview uses backend totals and refetches attendance when date changes', async () => {
  api.get.mockResolvedValue({ data: { data: overviewFixture } });
  renderHeader(<Dashboard />);
  expect(
    await screen.findByText('80%', { selector: '.live-kpi-value' }),
  ).toBeTruthy();
  expect(screen.getByText('8 / 10 active staff checked in')).toBeTruthy();
  expect(screen.queryByText('Demo dashboard')).toBeNull();
  expect(screen.getByText('No open team tasks.')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Attendance date'), {
    target: { value: '2026-09-15' },
  });
  await vi.waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      '/dashboard/overview',
      expect.objectContaining({ params: { date: '2026-09-15' } }),
    ),
  );
});
test('overview shows failure and supports retry without sample data', async () => {
  api.get
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ data: { data: overviewFixture } });
  renderHeader(<Dashboard />);
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.queryByText('Paid Invoices')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(
    await screen.findByText('80%', { selector: '.live-kpi-value' }),
  ).toBeTruthy();
});

test.each(['admin', 'super_admin', 'manager', 'hr'])(
  '%s navigation hides Team Workspace with stale grants',
  (role) => {
    useAuthStore.setState({
      user: {
        name: 'Account User',
        role,
        permissions: ['*', 'team.workspace.view', 'team.workspace.manage'],
      },
    });
    renderHeader();
    expect(screen.queryByRole('link', { name: 'Team Workspace' })).toBeNull();
  },
);

test('overview can pause updates, export the real snapshot and reset the attendance date', async () => {
  const exportSnapshot = vi
    .spyOn(exportTools, 'downloadOverview')
    .mockImplementation(() => {});
  api.get.mockResolvedValue({ data: { data: overviewFixture } });
  renderHeader(<Dashboard />);
  await screen.findByText('80%', { selector: '.live-kpi-value' });
  fireEvent.click(screen.getByText('More insights and dashboard tools'));
  fireEvent.click(screen.getByRole('button', { name: 'Pause live updates' }));
  expect(screen.getByText('Auto-refresh paused')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Export snapshot' }));
  expect(exportSnapshot).toHaveBeenCalledWith(overviewFixture);
  fireEvent.change(screen.getByLabelText('Attendance date'), {
    target: { value: '2026-09-15' },
  });
  fireEvent.click(await screen.findByRole('button', { name: 'Back to today' }));
  expect(screen.getByLabelText('Attendance date').value).not.toBe('2026-09-15');
  expect(screen.queryByRole('link', { name: 'Team workspace' })).toBeNull();
});
test('snapshot CSV contains totals and dates with safe quoted cells', () => {
  const csv = exportTools.overviewCSV({
    ...overviewFixture,
    date: '2026-10-16',
    leads: { '=formula': 2 },
  });
  expect(csv).toContain('"Finance","paid","12345","INR"');
  expect(csv).toContain('"Attendance","Date","2026-10-16","Asia/Kolkata"');
  expect(csv).toContain('"\'=formula"');
});

test('Employee Pulse and Delivery Status are visible without opening extra tools and use live totals', async () => {
  api.get.mockResolvedValue({ data: { data: overviewFixture } });
  renderHeader(<Dashboard />);
  const pulse = (
    await screen.findByRole('heading', { name: 'Employee Pulse' })
  ).closest('section');
  const delivery = screen
    .getByRole('heading', { name: 'Delivery Status' })
    .closest('section');
  expect(pulse.closest('details')).toBeNull();
  expect(delivery.closest('details')).toBeNull();
  expect(pulse.textContent).toContain('10');
  expect(pulse.textContent).toContain('6');
  expect(delivery.textContent).toContain('DONE');
  expect(pulse.querySelector('a').getAttribute('href')).toBe('/hrms/employees');
});
