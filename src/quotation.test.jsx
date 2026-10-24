import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuotationForm } from './pages/Quotations.jsx';
import { api } from './services/api.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('service titles and manual totals survive adding, renaming and removing services', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <QuotationForm onClose={() => {}} />
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByLabelText('Service title 1'), {
    target: { value: 'Brand strategy' },
  });
  fireEvent.change(screen.getByLabelText('Brand strategy detail 1'), {
    target: { value: 'Discovery' },
  });
  fireEvent.change(screen.getByLabelText('Service total 1'), {
    target: { value: '12000' },
  });
  expect(screen.getByLabelText('Brand strategy amount 1').required).toBe(false);
  fireEvent.click(screen.getByText('Add service'));
  fireEvent.change(screen.getByLabelText('Service title 2'), {
    target: { value: 'Launch support' },
  });
  fireEvent.click(screen.getByLabelText('Remove service 2'));
  expect(screen.queryByLabelText('Service title 2')).toBeNull();
  expect(screen.queryByText('GRAND TOTAL')).toBeNull();
  fireEvent.submit(screen.getByText('Create quotation').closest('form'));
  await waitFor(() => expect(post).toHaveBeenCalled());
  expect(post.mock.calls[0][1]).toMatchObject({
    services: ['Brand strategy'],
    serviceTotals: [{ service: 'Brand strategy', total: 12000 }],
    items: [{ service: 'Brand strategy', description: 'Discovery' }],
  });
  expect(post.mock.calls[0][1].items[0]).not.toHaveProperty('amount');
});
