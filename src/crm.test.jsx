import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from './services/api.js';
import { useAuthStore } from './store/authStore.js';
import {
  crmPermissions,
  stages,
  priorities,
  temperatures,
  sources,
  lostReasons,
  serviceCatalog,
} from '../shared/crm.js';
import Leads from './pages/crm/Leads.jsx';
import LeadDetail from './pages/crm/LeadDetail.jsx';
import FollowUps from './pages/crm/FollowUps.jsx';
import Pipeline from './pages/crm/Pipeline.jsx';
import CRMGlobalSearch from './components/crm/CRMGlobalSearch.jsx';
import { dateRange } from './components/crm/CRMDateFilter.jsx';
import { ConvertDialog } from './components/crm/LeadBusinessPanels.jsx';
import LeadImportDialog from './components/crm/LeadImportDialog.jsx';
const lead = {
  _id: '123456789012345678901234',
  leadId: 'ADB/LEAD/0001',
  companyName: 'Acme CRM',
  contactPerson: 'Buyer',
  phone: '+919988776655',
  email: 'buyer@example.test',
  website: '',
  whatsapp: '',
  industry: '',
  address: {},
  stage: 'NEW',
  priority: 'HIGH',
  temperature: 'HOT',
  leadSource: 'Website',
  interestedServices: ['web'],
  estimatedBudget: 80000,
  currency: 'INR',
  probability: 50,
  createdAt: '2026-10-01T00:00:00Z',
  notes: '',
  tags: [],
  attachments: [],
  assignedTo: { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'Sales Owner' },
};
const metadata = {
  stages,
  priorities,
  temperatures,
  sources,
  lostReasons,
  serviceCatalog,
  stageLabels: {},
  defaultFollowUpDays: 1,
  permissions: crmPermissions,
};
const paginated = (items) => ({
  items,
  pagination: { page: 1, total: items.length, totalPages: 1 },
});
function mount(element, path = '/crm/leads') {
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
          <Route path="/crm/leads/:id" element={element} />
          <Route path="*" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  useAuthStore.getState().setSession({
    user: {
      name: 'Admin',
      role: 'admin',
      permissions: [
        ...crmPermissions,
        'quotations.read',
        'quotations.manage',
        'invoices.manage',
      ],
    },
    accessToken: 'test',
  });
  vi.spyOn(api, 'get').mockImplementation(async (url, config) => ({
    data: {
      data:
        url === '/crm/metadata'
          ? metadata
          : url === '/crm/assignees'
            ? {
                items: [
                  {
                    _id: lead.assignedTo._id,
                    name: 'Sales Owner',
                    role: 'executive',
                  },
                ],
              }
            : url === '/crm/leads/duplicates'
              ? { items: [] }
              : url === '/crm/pipeline'
                ? {
                    stages: [
                      {
                        _id: { stage: 'NEW', currency: 'INR' },
                        count: 1,
                        value: 80000,
                      },
                    ],
                  }
                : url === '/crm/clients'
                  ? { items: [] }
                  : url.includes('/activities')
                    ? paginated([])
                    : url.includes('/follow-ups')
                      ? { ...paginated([]), summary: {} }
                      : url === `/crm/leads/${lead._id}`
                        ? lead
                        : paginated(
                            config?.params?.stage &&
                              config.params.stage !== 'NEW'
                              ? []
                              : [lead],
                          ),
    },
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('lead form validates on the client and submits a connected lead', async () => {
  const post = vi
    .spyOn(api, 'post')
    .mockResolvedValue({ data: { message: 'Lead created', data: lead } });
  mount(<Leads />);
  expect(await screen.findByText('Acme CRM')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Add Lead' }));
  fireEvent.change(screen.getByLabelText('Company name'), {
    target: { value: 'New business' },
  });
  fireEvent.change(within(screen.getByRole('dialog')).getByLabelText('Phone'), {
    target: { value: 'invalid' },
  });
  fireEvent.submit(
    screen.getByRole('button', { name: 'Save Lead' }).closest('form'),
  );
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    expect.stringContaining('Invalid phone'),
  );
  expect(post).not.toHaveBeenCalled();
  fireEvent.change(within(screen.getByRole('dialog')).getByLabelText('Phone'), {
    target: { value: '+91 9876543210' },
  });
  fireEvent.submit(
    screen.getByRole('button', { name: 'Save Lead' }).closest('form'),
  );
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(
      '/crm/leads',
      expect.objectContaining({
        companyName: 'New business',
        phone: '+919876543210',
        stage: 'NEW',
      }),
    ),
  );
});

test('lead detail changes stage with a lost reason', async () => {
  const post = vi
    .spyOn(api, 'post')
    .mockResolvedValue({ data: { message: 'Stage updated' } });
  mount(<LeadDetail />, `/crm/leads/${lead._id}`);
  await screen.findByRole('heading', { name: 'Acme CRM' });
  fireEvent.click(screen.getByRole('button', { name: 'Mark Lost' }));
  await screen.findByRole('option', { name: 'Budget' });
  fireEvent.change(screen.getByLabelText('Lost reason'), {
    target: { value: 'Budget' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Update stage' }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(`/crm/leads/${lead._id}/change-stage`, {
      stage: 'LOST',
      lostReason: 'Budget',
      lostDetail: '',
    }),
  );
});

test('follow-up completion captures outcome and preserves the lead reference', async () => {
  const record = {
    _id: 'follow-1',
    followUpId: 'ADB/FUP/0001',
    lead,
    type: 'CALL',
    status: 'PENDING',
    scheduledAt: '2026-10-16T09:00:00Z',
    priority: 'HIGH',
    assignedTo: { name: 'Sales Owner' },
  };
  api.get.mockResolvedValue({
    data: { data: { ...paginated([record]), summary: { today: 1 } } },
  });
  const post = vi
    .spyOn(api, 'post')
    .mockResolvedValue({ data: { message: 'Follow-up completed' } });
  mount(<FollowUps />);
  fireEvent.click(await screen.findByRole('button', { name: 'Complete' }));
  fireEvent.change(screen.getByLabelText('Outcome'), {
    target: { value: 'Requested proposal' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save follow-up' }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith('/crm/follow-ups/follow-1/complete', {
      outcome: 'Requested proposal',
    }),
  );
});

test('failed pipeline drop shows an error and retains the original card', async () => {
  vi.spyOn(api, 'post').mockRejectedValue({
    response: { data: { error: { message: 'Stage update denied' } } },
  });
  mount(<Pipeline />);
  const card = await screen.findByRole('link', { name: 'Acme CRM' });
  fireEvent.dragStart(card.closest('article'));
  fireEvent.drop(
    screen.getByRole('heading', { name: /Contacted/ }).closest('section'),
  );
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Stage update denied',
  );
  expect(screen.getByRole('link', { name: 'Acme CRM' })).toBeTruthy();
});

test('conversion reviews client details and surfaces duplicate conversion errors', async () => {
  const post = vi.spyOn(api, 'post').mockRejectedValue({
    response: {
      data: { error: { message: 'This lead has already been converted' } },
    },
  });
  mount(<ConvertDialog lead={lead} onClose={vi.fn()} />);
  const confirm = await screen.findByRole('button', {
    name: 'Confirm conversion',
  });
  await waitFor(() => expect(confirm.disabled).toBe(false));
  fireEvent.click(confirm);
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith(
      `/crm/leads/${lead._id}/convert`,
      expect.objectContaining({
        client: expect.objectContaining({
          companyName: 'Acme CRM',
          phone: '+919988776655',
        }),
      }),
    ),
  );
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'This lead has already been converted',
  );
});

test('global search debounces scoped lead requests and links to the lead', async () => {
  mount(<CRMGlobalSearch onNavigate={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Global lead search'), {
    target: { value: 'Acme' },
  });
  const result = await screen.findByRole('link', { name: /ADB\/LEAD\/0001/ });
  expect(result.getAttribute('href')).toBe(`/crm/leads/${lead._id}`);
  expect(api.get).toHaveBeenCalledWith(
    '/crm/leads',
    expect.objectContaining({ params: { search: 'Acme', limit: 8 } }),
  );
});

test('financial year and custom period helpers use India day boundaries', () => {
  expect(
    dateRange('financialYear', new Date('2026-02-15T12:00:00Z')).from,
  ).toBe('2025-03-31T18:30:00.000Z');
  expect(dateRange('lastMonth', new Date('2026-03-15T12:00:00Z'))).toEqual({
    from: '2026-01-31T18:30:00.000Z',
    to: '2026-02-28T18:29:59.999Z',
  });
});

test('Excel import previews, validates and imports only selected valid rows', async () => {
  const post = vi.spyOn(api, 'post').mockImplementation(async (url) => ({
    data: url.endsWith('/preview')
      ? {
          data: {
            batchId: 'batch-1',
            filename: 'leads.xlsx',
            sheetName: 'Leads',
            headers: ['Company Name', 'Phone'],
            mapping: { companyName: 0, phone: 1 },
            total: 2,
            sample: [{ row: 2, cells: ['Imported Lead', '+919911223344'] }],
          },
        }
      : url.endsWith('/validate')
        ? {
            data: {
              valid: 1,
              invalid: 1,
              rows: [
                {
                  row: 2,
                  companyName: 'Imported Lead',
                  status: 'VALID',
                  errors: [],
                  warnings: [],
                },
                {
                  row: 3,
                  companyName: 'Invalid Lead',
                  status: 'INVALID',
                  errors: ['phone: Invalid phone'],
                  warnings: [],
                },
              ],
            },
          }
        : {
            data: {
              results: [
                {
                  row: 2,
                  status: 'IMPORTED',
                  leadId: 'ADB/LEAD/0099',
                  lead: lead._id,
                  message: 'Lead created',
                },
              ],
            },
          },
  }));
  mount(<LeadImportDialog onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Excel workbook'), {
    target: {
      files: [
        new File(['test workbook'], 'leads.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      ],
    },
  });
  fireEvent.click(await screen.findByRole('button', { name: 'Validate rows' }));
  expect(await screen.findByText('phone: Invalid phone')).toBeTruthy();
  expect(screen.getByLabelText('Import Excel row 3').disabled).toBe(true);
  fireEvent.click(
    screen.getByRole('button', { name: 'Import selected valid leads' }),
  );
  expect(
    await screen.findByRole('link', { name: 'ADB/LEAD/0099' }),
  ).toBeTruthy();
  expect(post).toHaveBeenCalledWith(
    '/crm/leads/import/batch-1/commit',
    expect.objectContaining({ rows: [2] }),
    expect.objectContaining({ timeout: 60000 }),
  );
});
