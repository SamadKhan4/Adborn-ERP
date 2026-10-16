import React from 'react';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore.js';
import { api } from './services/api.js';
import TeamWorkspace from './pages/team/TeamWorkspace.jsx';
import MyWork from './pages/team/MyWork.jsx';
import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';
import { defaultRouteForRole } from './config/navigation.js';
const leader = { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Team Leader', department: 'web_dev' };
const member = { _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', name: 'Team Member', email: 'member@example.test', department: 'web_dev' };
const task = { _id: 'cccccccccccccccccccccccc', taskId: 'ADB/TASK/0001', title: 'Deliver feature', status: 'TODO', description: 'Build the requested feature', acceptanceCriteria: 'Tests pass', assignedTo: member, points: 5, priority: 'HIGH', version: 0 };
const workspace = { leader, members: [member], sprints: [], summary: [{ _id: 'TODO', count: 1, points: 5, overdue: 0 }], workload: [{ _id: member._id, tasks: 1, points: 5, blocked: 0 }], standups: [], attendance: [], reports: [], activity: [], date: '2026-10-16' };
function mount(element) { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter>{element}</MemoryRouter></QueryClientProvider>); }
beforeEach(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
  useAuthStore.getState().setSession({ user: { id: leader._id, name: leader.name, role: 'team_leader', permissions: ['team.workspace.view', 'team.workspace.manage', 'team.tasks.self'] }, accessToken: 'test' });
  vi.spyOn(api, 'get').mockImplementation(async (url) => ({ data: { data: url === '/team/leaders' ? { items: [leader] } : url === '/team/workspace' ? workspace : url === '/team/tasks' ? { items: [task], pagination: { page: 1, total: 1, totalPages: 1 } } : { leader, tasks: [task], standup: null, date: '2026-10-16', pagination: { page: 1, total: 1, totalPages: 1 } } } }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
test('team leader opens the delivery workspace and creates a scoped team task', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { message: 'Task created' } });
  mount(<TeamWorkspace />);
  fireEvent.click(await screen.findByRole('button', { name: 'Task Board' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Create Task' }));
  fireEvent.change(screen.getByLabelText('Task title'), { target: { value: 'New sprint feature' } });
  fireEvent.change(screen.getByLabelText('Assigned member'), { target: { value: member._id } });
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/team/tasks', expect.objectContaining({ title: 'New sprint feature', assignedTo: member._id, status: 'TODO' }), { params: { leader: leader._id } }));
  expect(defaultRouteForRole('team_leader')).toBe('/employee');
});
test('employee reports a task blocker without changing assignment', async () => {
  useAuthStore.getState().setSession({ user: { id: member._id, name: member.name, role: 'employee', permissions: ['team.tasks.self'] }, accessToken: 'test' });
  const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { message: 'Task updated' } });
  mount(<MyWork />);
  fireEvent.click(await screen.findByRole('button', { name: 'Update progress / blocker' }));
  fireEvent.change(screen.getByLabelText('Task status'), { target: { value: 'BLOCKED' } });
  fireEvent.change(screen.getByLabelText('Blocker / help needed'), { target: { value: 'Need design review' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }));
  await waitFor(() => expect(patch).toHaveBeenCalledWith(`/team/my-tasks/${task._id}`, { status: 'BLOCKED', blocker: 'Need design review', version: 0 }, { params: { leader: undefined } }));
});
test('employee submits a structured daily stand-up', async () => {
  useAuthStore.getState().setSession({ user: { id: member._id, role: 'employee', permissions: ['team.tasks.self'] }, accessToken: 'test' });
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { message: 'Stand-up saved' } });
  mount(<MyWork />);
  fireEvent.click(await screen.findByRole('button', { name: 'Submit Stand-up' }));
  fireEvent.change(screen.getByLabelText('Plan for today'), { target: { value: 'Complete the feature' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save stand-up' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/team/standups', { leader: leader._id, yesterday: '', today: 'Complete the feature', blockers: '' }));
});
test.each(['admin', 'super_admin', 'manager', 'hr'])('%s cannot open Team Workspace even with stale grants', (role) => {
  useAuthStore.getState().setSession({ user: { role, permissions: ['*', 'team.workspace.view', 'team.workspace.manage', 'hrms.read'] }, accessToken: 'test' });
  mount(<TeamWorkspace />);
  expect(screen.getByRole('alert').textContent).toContain('do not have permission');
  expect(api.get).not.toHaveBeenCalled();
});

test('assigned tasks appear directly on the employee dashboard and progress updates use the same task', async () => {
  useAuthStore.getState().setSession({ user: { id: member._id, name: member.name, role: 'employee', permissions: ['hrms.self', 'team.tasks.self'] }, accessToken: 'test' });
  let currentTask = { ...task };
  api.get.mockImplementation(async (url) => ({ data: { data: url === '/hrms/employee-dashboard' ? { employee: { name: member.name, email: member.email, role: 'employee', profile: {} }, todayAttendance: null, dailyReport: null, dailyReports: [], recentAttendance: [], leaveBalances: [], holidays: [], upcomingHolidays: [], payslips: [], announcements: [], leaveRequests: [], assets: [], tasks: [{ id: 'onboarding', label: 'Verify documents', completed: false }] } : { leader, tasks: [currentTask], standup: null, date: '2026-10-16', pagination: { page: 1, total: 1, totalPages: 1 }, summary: [{ _id: currentTask.status, count: 1 }] } } }));
  const patch = vi.spyOn(api, 'patch').mockImplementation(async (url, body) => { currentTask = { ...currentTask, ...body, version: 1 }; return { data: { message: 'Task updated' } }; });
  mount(<EmployeeDashboard />);
  expect(await screen.findByRole('heading', { name: 'Assigned Team Tasks' })).toBeTruthy();
  expect(await screen.findByRole('heading', { name: 'Deliver feature' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Onboarding Checklist' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Update progress / blocker' }));
  fireEvent.change(screen.getByLabelText('Task status'), { target: { value: 'IN_PROGRESS' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save task' }));
  await waitFor(() => expect(patch).toHaveBeenCalledWith(`/team/my-tasks/${task._id}`, { status: 'IN_PROGRESS', blocker: '', version: 0 }, { params: { leader: undefined } }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(await screen.findAllByText('In Progress')).toHaveLength(2);
  expect(api.get).toHaveBeenCalledWith('/team/my-work', { params: { page: 1, view: 'open', limit: 6 } });
});
