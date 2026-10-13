import React from 'react';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import RecentInvoices from './components/dashboard/RecentInvoices.jsx';
import ERPHeader from './components/layout/ERPHeader.jsx';
import { useAuthStore } from './store/authStore.js';
beforeEach(() =>
  useAuthStore.getState().setSession({
    user: {
      name: 'Test Admin',
      email: 'test@example.test',
      role: 'super_admin',
    },
    accessToken: 'test',
  }),
);
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
  render(
    <MemoryRouter>
      <ERPHeader />
    </MemoryRouter>,
  );
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
  render(
    <MemoryRouter>
      <ERPHeader />
    </MemoryRouter>,
  );
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
  render(<MemoryRouter><ERPHeader /></MemoryRouter>);
  const links = screen.getByRole('navigation', { name: 'Primary navigation' }).querySelectorAll('a');
  expect([...links].map((link) => link.textContent.trim())).toEqual(['HRMS', 'Departments']);
});
function RouteProbe() {
  const location = useLocation();
  return <p data-testid="current-route">{location.pathname}</p>;
}
test('dragging the header scrolls tabs and suppresses accidental mouse selection', () => {
  render(
    <MemoryRouter>
      <ERPHeader />
      <RouteProbe />
    </MemoryRouter>,
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
