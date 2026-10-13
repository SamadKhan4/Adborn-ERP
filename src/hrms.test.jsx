import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ERPHeader from './components/layout/ERPHeader.jsx';
import HRMSLayout from './components/hrms/HRMSLayout.jsx';
import HRMSModulePage from './pages/hrms/HRMSModulePage.jsx';
import Employees from './pages/hrms/Employees.jsx';
import { api } from './services/api.js';
import { useAuthStore } from './store/authStore.js';

function LocationProbe() {
  return <span data-testid="route">{useLocation().pathname}</span>;
}

function mountWorkspace(path, page) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/hrms" element={<HRMSLayout />}>
            <Route path=":module" element={<>{page}<LocationProbe /></>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  useAuthStore.getState().setSession({ user: { name: 'Super Admin', role: 'super_admin', email: 'admin@example.test' }, accessToken: 'test' });
  vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { items: [], pagination: { nextCursor: null } } } });
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('global HRMS tab targets the nested dashboard route', () => {
  render(<MemoryRouter><ERPHeader /><LocationProbe /></MemoryRouter>);
  fireEvent.click(screen.getByRole('link', { name: 'HRMS' }));
  expect(screen.getByTestId('route').textContent).toBe('/hrms/dashboard');
});

test('HRMS sidebar collapses and keeps icon links accessible', () => {
  mountWorkspace('/hrms/employees', <Employees />);
  fireEvent.click(screen.getByRole('button', { name: 'Collapse HRMS sidebar' }));
  expect(screen.getByRole('button', { name: 'Expand HRMS sidebar' })).toBeTruthy();
  expect(screen.getAllByRole('link', { name: 'Employees' }).length).toBeGreaterThan(0);
});

test('mobile HRMS navigation opens as an accessible drawer', () => {
  mountWorkspace('/hrms/employees', <Employees />);
  fireEvent.click(screen.getByRole('button', { name: 'Open HRMS navigation' }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Close HRMS navigation' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('Add Employee requires an onboarding form', async () => {
  mountWorkspace('/hrms/employees', <Employees />);
  fireEvent.click(screen.getByRole('button', { name: 'Add Employee' }));
  expect(await screen.findByText('No onboarding form is ready.')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Open onboarding' })).toBeTruthy();
});

test('Add Employee fills details from the selected onboarded user and shows generated credentials', async () => {
  api.get.mockImplementation(async (url) => url === '/hrms/onboarding' ? {
    data: { data: { items: [{
      _id: 'onboarding-1', title: 'Riya Shah', department: 'graphics', status: 'Unassigned',
      data: { personal: { email: 'riya@example.test' }, employment: { designation: 'Graphic Designer' } },
    }] } },
  } : { data: { data: { items: [], pagination: { nextCursor: null } } } });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {
    employee: { name: 'Riya Shah', email: 'riya@example.test', department: 'graphics', role: 'team_leader' },
    profile: { employeeCode: 'ADB-EMP-0001', designation: 'Graphic Designer' },
  } } });
  mountWorkspace('/hrms/employees', <Employees />);
  fireEvent.click(screen.getByRole('button', { name: 'Add Employee' }));
  fireEvent.change(await screen.findByLabelText('Onboarding user'), { target: { value: 'onboarding-1' } });
  expect(screen.getByDisplayValue('riya@example.test')).toBeTruthy();
  expect(screen.getByDisplayValue('Graphic Designer')).toBeTruthy();
  expect(screen.getByDisplayValue('Graphics')).toBeTruthy();
  expect(screen.getByDisplayValue('Generated after creation')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Employee type'), { target: { value: 'team_leader' } });
  fireEvent.change(screen.getByLabelText('Employee temporary password'), { target: { value: 'EmployeePass123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create employee' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/hrms/employees/from-onboarding/onboarding-1', { temporaryPassword: 'EmployeePass123', role: 'team_leader' }));
  expect(await screen.findByText('Riya Shah created successfully')).toBeTruthy();
  expect(screen.getByDisplayValue('ADB-EMP-0001')).toBeTruthy();
});

test('module shells search demo records without calling write APIs', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      data: { items: [
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
      ], pagination: { nextCursor: null } },
    },
  });
  const post = vi.spyOn(api, 'post');
  mountWorkspace('/hrms/recruitment', <HRMSModulePage />);
  expect(await screen.findByText('React Developer')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Search recruitment'), { target: { value: 'motion' } });
  await waitFor(() => expect(screen.getByText('Motion Designer')).toBeTruthy());
  expect(screen.queryByText('React Developer')).toBeNull();
  expect(post).not.toHaveBeenCalled();
});
