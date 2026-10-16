import React from 'react';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Departments from './pages/Departments.jsx';
import DepartmentDetail from './pages/DepartmentDetail.jsx';
import { api } from './services/api.js';
import { useAuthStore } from './store/authStore.js';
const department = {
  _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  key: 'engineering',
  departmentId: 'ADB/DEPT/006',
  name: 'Engineering',
  code: 'ENG',
  description: 'Product development',
  status: 'ACTIVE',
  departmentHead: { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Team Lead' },
  employeeCount: 4,
  activeProjects: 2,
};
const person = {
  _id: 'cccccccccccccccccccccccc',
  name: 'Real Employee',
  email: 'real@employee.test',
  role: 'employee',
  active: true,
  profile: {
    employeeCode: 'ADB-EMP-0010',
    designation: 'Developer',
    manager: { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Team Lead' },
    employmentType: 'full_time',
  },
};
const pagination = { page: 1, total: 1, totalPages: 1 };
function mount(element = <Departments />, path = '/departments') {
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
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/departments/:id" element={element} />
          <Route path="*" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  useAuthStore.getState().setSession({
    user: {
      id: 'dddddddddddddddddddddddd',
      name: 'Admin',
      role: 'admin',
      permissions: [
        'departments.view',
        'departments.create',
        'departments.edit',
        'departments.manage_members',
        'departments.change_head',
        'departments.view_analytics',
      ],
    },
    accessToken: 'test',
  });
  vi.spyOn(api, 'get').mockImplementation(async (url, config) => {
    if (url === '/departments/people')
      return {
        data: {
          data: {
            items: [
              person,
              {
                _id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
                name: 'Team Lead',
                role: 'team_leader',
              },
            ],
          },
        },
      };
    if (url === '/departments' && !config?.params)
      return {
        data: {
          data: [
            {
              id: department.key,
              _id: department._id,
              name: department.name,
              code: department.code,
              status: 'ACTIVE',
            },
          ],
        },
      };
    if (url === '/departments')
      return {
        data: {
          data: {
            items: [department],
            summary: { total: 1, active: 1, employees: 4, teamLeads: 1 },
            pagination,
          },
        },
      };
    if (url.endsWith('/summary'))
      return {
        data: {
          data: {
            employees: 4,
            present: 3,
            onLeave: 0,
            absent: 1,
            late: 1,
            wfh: 0,
            projects: { Active: 2 },
            tasks: {},
            basis: 'Current membership',
          },
        },
      };
    if (url.endsWith('/employees'))
      return { data: { data: { items: [person], pagination } } };
    if (
      url.endsWith('/activity') ||
      url.endsWith('/projects') ||
      url.endsWith('/designations')
    )
      return { data: { data: { items: [], pagination } } };
    return { data: { data: department } };
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test('list shows real cards, counts and backend search/status filters', async () => {
  mount();
  expect(
    await screen.findByRole('heading', { name: 'Engineering' }),
  ).toBeTruthy();
  expect(screen.getByText('Team Lead')).toBeTruthy();
  expect(
    screen.getByRole('link', { name: /View Department/ }).getAttribute('href'),
  ).toBe(`/departments/${department._id}`);
  fireEvent.change(screen.getByLabelText('Search Departments'), {
    target: { value: 'Engineering' },
  });
  fireEvent.change(screen.getByLabelText('Department status filter'), {
    target: { value: 'INACTIVE' },
  });
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      '/departments',
      expect.objectContaining({
        params: expect.objectContaining({
          search: 'Engineering',
          status: 'INACTIVE',
          page: 1,
        }),
      }),
    ),
  );
});
test('department creation submits real form values and blocks duplicate client names', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({
    data: { data: { ...department, name: 'Quality Assurance', code: 'QA' } },
  });
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Add Department' }));
  const name = await screen.findByLabelText('Department Name');
  fireEvent.change(name, { target: { value: 'Engineering' } });
  fireEvent.change(screen.getByLabelText('Department Code'), {
    target: { value: 'QA' },
  });
  await screen.findByRole('option', { name: 'Engineering' });
  fireEvent.click(screen.getByRole('button', { name: 'Save Department' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(post).not.toHaveBeenCalled();
  fireEvent.change(name, { target: { value: 'Quality Assurance' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Department' }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(
      '/departments',
      expect.objectContaining({
        name: 'Quality Assurance',
        code: 'QA',
        status: 'ACTIVE',
        departmentHead: null,
        parentDepartment: null,
      }),
    ),
  );
});
test('detail shows live analytics and paginated employee records and saves assignment', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
  mount(<DepartmentDetail />, `/departments/${department._id}?tab=employees`);
  expect(await screen.findByText('Real Employee')).toBeTruthy();
  expect(screen.getByText('ADB-EMP-0010')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Engineering' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Transfer / Manager' }));
  expect(await screen.findByRole('dialog')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Employee Designation'), {
    target: { value: 'Senior Developer' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save Assignment' }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith('/departments/engineering/employees', {
      employee: person._id,
      designation: 'Senior Developer',
      manager: 'bbbbbbbbbbbbbbbbbbbbbbbb',
    }),
  );
});
test('deactivation uses the status endpoint and inactive detail blocks new assignments', async () => {
  const patch = vi
    .spyOn(api, 'patch')
    .mockResolvedValue({ data: { data: {} } });
  mount();
  await screen.findByText('Engineering');
  fireEvent.click(screen.getByText('Deactivate'));
  await waitFor(() =>
    expect(patch).toHaveBeenCalledWith(
      `/departments/${department._id}/status`,
      { status: 'INACTIVE' },
    ),
  );
  cleanup();
  api.get.mockResolvedValue({
    data: { data: { ...department, status: 'INACTIVE' } },
  });
  mount(<DepartmentDetail />, `/departments/${department._id}`);
  expect(
    (await screen.findByRole('button', { name: 'Manage Employees' })).disabled,
  ).toBe(true);
});
test('permission denied makes no management requests; manager view hides write actions', async () => {
  useAuthStore.setState({ user: { role: 'employee', permissions: [] } });
  mount();
  expect(screen.getByRole('alert').textContent).toContain('permission');
  expect(api.get).not.toHaveBeenCalled();
  cleanup();
  useAuthStore.setState({
    user: {
      role: 'manager',
      permissions: ['departments.view', 'departments.view_analytics'],
    },
  });
  mount();
  await screen.findByText('Engineering');
  expect(screen.queryByRole('button', { name: 'Add Department' })).toBeNull();
});
test('API failure shows retry; empty data shows the real empty state', async () => {
  api.get.mockRejectedValueOnce(new Error('Offline'));
  mount();
  expect(await screen.findByRole('alert')).toBeTruthy();
  api.get.mockResolvedValue({
    data: {
      data: {
        items: [],
        summary: {},
        pagination: { page: 1, total: 0, totalPages: 0 },
      },
    },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('No departments found.')).toBeTruthy();
});
