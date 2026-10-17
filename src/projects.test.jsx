import React from 'react';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Projects from './pages/Projects.jsx';
import { api } from './services/api.js';
import { useAuthStore } from './store/authStore.js';
const id = 'a'.repeat(24),
  employee = 'b'.repeat(24);
const project = {
  _id: id,
  title: 'Live website project',
  projectId: 'ADB/PRJ/0001',
  status: 'ONGOING',
  primaryDepartment: { _id: 'c'.repeat(24), name: 'Web development' },
  projectManager: { _id: employee, name: 'Actual Manager' },
  clientRef: { companyName: 'Actual Client' },
  teamMembers: [],
  progress: 50,
  taskSummary: { total: 2, done: 1 },
  milestoneSummary: { total: 1, completed: 0 },
  deadline: '2026-10-28',
  daysRemaining: 11,
  health: 'ON_TRACK',
  collaboratingDepartments: [],
  revision: 0,
};
const metadata = {
  permissions: ['*'],
  currentUserId: employee,
  scope: 'ALL',
  departments: [project.primaryDepartment],
  users: [project.projectManager],
  clients: [],
  quotations: [],
  leads: [],
  services: ['web'],
};
const dashboard = {
  total: 1,
  status: [{ _id: 'ONGOING', count: 1 }],
  departments: [{ name: 'Web development', count: 1 }],
  monthly: [{ _id: '2026-10', created: 1 }],
  completedMonthly: [],
  delayedCount: 0,
  timeline: [{ _id: 'Due within 30 days', count: 1 }],
  nearDeadline: [],
  recentlyCompleted: [],
  workload: [],
};
function mount(path = '/projects') {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={[path]}>
        <Projects />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  useAuthStore.setState({
    user: { _id: employee, role: 'super_admin', permissions: ['*'] },
  });
  vi.spyOn(api, 'get').mockImplementation(async (url, options) => ({
    data: {
      data:
        url === '/projects/metadata'
          ? metadata
          : url === '/projects/dashboard'
            ? dashboard
            : url === `/projects/${id}`
              ? project
              : url.endsWith('/financials')
                ? {
                    invoices: [],
                    budget: 1000,
                    currency: 'INR',
                    billedMinor: 0,
                    collectedMinor: 0,
                    outstandingMinor: 0,
                    directExpensesMinor: null,
                    costCoverage: 'No recorded costs',
                  }
                : {
                    items:
                      options?.params?.status &&
                      options.params.status !== 'ONGOING'
                        ? []
                        : [
                            url.endsWith('/notes')
                              ? {
                                  _id: 'note',
                                  author: { name: 'Actual Manager' },
                                  content: 'Live note',
                                  createdAt: '2026-10-17',
                                }
                              : project,
                          ],
                    pagination: { page: 1, limit: 10, total: 1, totalPages: 2 },
                  },
    },
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test('live project dashboard renders actual counts and project rows', async () => {
  mount();
  expect(await screen.findByText('Total Projects')).toBeTruthy();
  expect(screen.getByText('Delayed Projects')).toBeTruthy();
  expect(screen.getAllByText('Live website project').length).toBeGreaterThan(0);
  expect(screen.queryByText('+20%')).toBeNull();
});
test('project search and pagination use server query parameters', async () => {
  mount();
  await screen.findByText('Total Projects');
  fireEvent.change(
    screen.getByPlaceholderText('Search projects, project ID...'),
    { target: { value: 'website' } },
  );
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      '/projects',
      expect.objectContaining({
        params: expect.objectContaining({ search: 'website' }),
      }),
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      '/projects',
      expect.objectContaining({ params: expect.objectContaining({ page: 2 }) }),
    ),
  );
});
test('employee details hide financial and operational actions', async () => {
  useAuthStore.setState({
    user: {
      _id: employee,
      role: 'employee',
      permissions: [
        'projects.view',
        'projects.tasks.view',
        'projects.tasks.complete',
        'projects.files.view',
      ],
    },
  });
  mount(`/projects/${id}`);
  await screen.findByText('Project Overview');
  expect(screen.queryByRole('link', { name: 'Financials' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Edit Project' })).toBeNull();
  expect(screen.getByText('Live note')).toBeTruthy();
});
test('unauthorized project access is explicit and fetches no project data', async () => {
  useAuthStore.setState({ user: { role: 'hr', permissions: [] } });
  mount();
  expect(screen.getByRole('alert').textContent).toContain(
    "don't have permission",
  );
  expect(api.get).not.toHaveBeenCalled();
});
import ProjectForm from './components/projects/ProjectForm.jsx';
test('project creation form submits validated live project fields', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
  const close = vi.fn();
  mountForm();
  function mountForm() {
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ProjectForm mode="project" metadata={metadata} onClose={close} />
      </QueryClientProvider>,
    );
  }
  fireEvent.change(screen.getByLabelText(/Project name/), {
    target: { value: 'Internal delivery' },
  });
  fireEvent.change(screen.getByLabelText(/Project type/), {
    target: { value: 'Internal Project' },
  });
  fireEvent.change(screen.getByLabelText(/Primary department/), {
    target: { value: project.primaryDepartment._id },
  });
  fireEvent.change(screen.getByLabelText(/Project manager/), {
    target: { value: employee },
  });
  fireEvent.change(screen.getByLabelText(/Deadline/), {
    target: { value: '2026-11-28' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(
      '/projects',
      expect.objectContaining({
        title: 'Internal delivery',
        projectType: 'Internal Project',
        deadline: '2026-11-28',
      }),
    ),
  );
  expect(close).toHaveBeenCalled();
});
