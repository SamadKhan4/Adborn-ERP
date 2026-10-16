import React from 'react';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Invoices from './pages/Invoices.jsx';
import { api } from './services/api.js';
beforeEach(() => {
  vi.spyOn(api, 'get').mockImplementation(async (_, config) => ({
    data: {
      data: {
        items: [],
        pagination: { page: config.params.page, totalPages: 2, total: 21 },
      },
    },
  }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test('overdue shortcut applies the server view and moves between filtered result pages', async () => {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={['/invoices?status=Overdue']}>
        <Invoices />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      '/invoices',
      expect.objectContaining({ params: { page: 1, view: 'overdue' } }),
    ),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Next invoice page' }).disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Next invoice page' }));
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      '/invoices',
      expect.objectContaining({ params: { page: 2, view: 'overdue' } }),
    ),
  );
  fireEvent.change(screen.getByLabelText('Filter status'), {
    target: { value: 'Outstanding' },
  });
  await waitFor(() =>
    expect(api.get).toHaveBeenCalledWith(
      '/invoices',
      expect.objectContaining({ params: { page: 1, view: 'outstanding' } }),
    ),
  );
});
