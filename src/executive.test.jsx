import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ExecutiveCRMPanel from './components/crm/ExecutiveCRMPanel.jsx';
import { useAuthStore } from './store/authStore.js';
import { api } from './services/api.js';
import { canView, navigation, defaultRouteForRole } from './config/navigation.js';
afterEach(() => { cleanup(); vi.restoreAllMocks(); useAuthStore.getState().clearAuth(); });
test('executive retains employee landing page and gets CRM without HR administration', () => {
  const user = { role: 'executive', permissions: ['hrms.self', 'crm.dashboard.view'] };
  const visible = navigation.filter((item) => canView(user, item)).map((item) => item.label);
  expect(visible).toContain('My Dashboard');
  expect(visible).toContain('CRM');
  expect(visible).not.toContain('HRMS');
  expect(visible).not.toContain('Employee Management');
  expect(defaultRouteForRole('executive')).toBe('/employee');
});
test('executive workspace displays live scoped totals and links to lead call workflow', async () => {
  useAuthStore.setState({ user: { role: 'executive', permissions: ['crm.dashboard.view', 'crm.leads.create'] } });
  vi.spyOn(api, 'get').mockImplementation(async (url) => ({ data: { data: url === '/crm/dashboard'
    ? { totals: { total: 17, open: 12, followupsToday: 3, overdueFollowups: 2 } }
    : { items: [{ _id: 'lead-1', companyName: 'Real Customer', stage: 'NEW', phone: '12345' }] } } }));
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><ExecutiveCRMPanel /></MemoryRouter></QueryClientProvider>);
  expect(await screen.findByText('17')).toBeTruthy();
  expect((await screen.findByRole('link', { name: /Real Customer/ })).getAttribute('href')).toBe('/crm/leads/lead-1');
  expect(screen.getByRole('button', { name: 'Add Lead' })).toBeTruthy();
  expect(screen.getByRole('link', { name: /log calls/ }).getAttribute('href')).toBe('/crm/leads');
});
