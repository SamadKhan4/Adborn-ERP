import React from 'react';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RecentInvoices from './components/dashboard/RecentInvoices.jsx';
import ERPHeader from './components/layout/ERPHeader.jsx';
import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';
import { useAuthStore } from './store/authStore.js';
import { api } from './services/api.js';

function renderHeader(children = <ERPHeader />) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
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
  vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { items: [], unreadCount: 0 } } });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test('invoice search and status filter operate only on demo records', () => {
  render(
    <MemoryRouter>
      <RecentInvoices />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText('Search demo invoices'), {
    target: { value: 'globex' },
  });
  expect(screen.getByText('INV-1032')).toBeTruthy();
  expect(screen.queryByText('INV-1031')).toBeNull();
  fireEvent.change(screen.getByLabelText('Invoice status'), {
    target: { value: 'Pending' },
  });
  expect(screen.getByText('No demo invoices match your filters.')).toBeTruthy();
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
test('HR sees only HRMS and Departments in global navigation', () => {
  useAuthStore.setState({
    user: {
      name: 'HR User',
      role: 'hr',
      permissions: ['dashboard.view', 'users.read', 'users.manage', 'hrms.read', 'hrms.manage', 'hrms.approve', 'hrms.payroll.read'],
    },
  });
  renderHeader();
  const links = screen.getByRole('navigation', { name: 'Primary navigation' }).querySelectorAll('a');
  expect([...links].map((link) => link.textContent.trim())).toEqual(['HRMS', 'Departments']);
});
function RouteProbe() {
  const location = useLocation();
  return <p data-testid="current-route">{location.pathname}</p>;
}
test('dragging the header scrolls tabs and suppresses accidental mouse selection', () => {
  renderHeader(<><ERPHeader /><RouteProbe /></>);
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
  useAuthStore.setState({ user: { name: 'Riya Shah', role: 'employee', email: 'riya@example.test' } });
  api.get.mockResolvedValue({ data: { data: {
    employee: { name: 'Riya Shah', email: 'riya@example.test', role: 'employee', department: 'graphics', profile: { employeeCode: 'ADB-EMP-0001', designation: 'Designer', employmentType: 'full_time', address: { current: 'Mumbai' } } },
    todayAttendance: null, dailyReport: null, dailyReports: [], recentAttendance: [], leaveBalances: [], holidays: [], upcomingHolidays: [], payslips: [], announcements: [], leaveRequests: [], assets: [], tasks: [],
  } } });
  const scrollIntoView = vi.fn();
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
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
