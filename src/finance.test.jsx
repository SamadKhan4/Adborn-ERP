import React from 'react';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Finance from './pages/Finance.jsx';
import FinanceForm from './components/finance/FinanceForm.jsx';
import { api } from './services/api.js';
const invoice = { _id: 'a'.repeat(24), invoiceNumber: 'ADB/INV/2026-27/0001', client: { company: 'Live Client', email: 'client@example.test' }, invoiceDate: '2026-10-01', dueDate: '2026-10-10', totalMinor: 118000, paidMinor: 40000, balanceMinor: 78000, financeStatus: 'PARTIALLY_PAID', daysOverdue: 7, revision: 0 };
const metadata = { permissions: ['*'], scope: 'ALL', clients: [{ _id: 'b'.repeat(24), companyName: 'Live Client' }], projects: [], quotations: [], departments: [], users: [], methods: ['BANK_TRANSFER'], expenseCategories: ['Miscellaneous'], services: [{ id: 'web', label: 'Web' }], invoices: [invoice], settings: { companyName: 'AdBorn', stateCode: '27' } };
const dashboard = { totals: { billedMinor: 118000, collectedMinor: 40000, outstandingMinor: 78000, overdueMinor: 78000, expenseMinor: 10000, netCashMinor: 30000, invoices: 1, dueToday: 0, partiallyPaid: 1, recurring: 0 }, months: [], services: [], expenseCategories: [], aging: [], clients: [], outstanding: [invoice], recentPayments: [], basis: 'Live receipts and integer paise' };
function mount(component, path = '/finance') { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={[path]}>{component}</MemoryRouter></QueryClientProvider>); }
beforeEach(() => { vi.spyOn(api, 'get').mockImplementation(async (url) => ({ data: { data: url === '/finance/metadata' ? metadata : url === '/finance/settings' ? metadata.settings : url === '/finance/dashboard' ? dashboard : { items: [invoice], pagination: { page: 1, total: 22, totalPages: 2 } } } })); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
test('reference-style dashboard uses actual billing/collection totals without invented profit', async () => {
  mount(<Finance />); expect(await screen.findByText('Total Billed')).toBeTruthy();
  expect(screen.getByText('Collected Revenue')).toBeTruthy(); expect(screen.getByText('Net Cash Movement')).toBeTruthy();
  expect(screen.queryByText('Net Profit')).toBeNull(); expect(screen.getByText('Live receipts and integer paise')).toBeTruthy();
  expect(screen.getByRole('link', { name: invoice.invoiceNumber })).toBeTruthy();
});
test('invoice search and pagination are sent to the backend', async () => {
  mount(<Finance />, '/finance/invoices'); await screen.findByText(invoice.invoiceNumber);
  fireEvent.change(screen.getByLabelText('Search finance'), { target: { value: 'Live' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }));
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/finance/invoices', expect.objectContaining({ params: expect.objectContaining({ search: 'Live', page: 1 }) })));
  fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/finance/invoices', expect.objectContaining({ params: expect.objectContaining({ page: 2 }) })));
});
test('payment form selects a permitted invoice and submits a stable idempotency key', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } }), close = vi.fn();
  mount(<FinanceForm mode="payment" row={invoice} metadata={metadata} onClose={close} />);
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/finance/payments', expect.objectContaining({ invoice: invoice._id, amount: '780.00', method: 'BANK_TRANSFER' }), expect.objectContaining({ headers: { 'Idempotency-Key': expect.any(String) } })));
  expect(close).toHaveBeenCalledWith('Saved successfully.');
});
test('finance source permissions hide unauthorized actions and direct navigation is denied', async () => {
  api.get.mockImplementation(async (url) => ({ data: { data: url === '/finance/metadata' ? { ...metadata, permissions: ['finance.expenses.view'] } : { items: [], pagination: { page: 1, total: 0, totalPages: 0 } } } }));
  mount(<Finance />, '/finance/invoices'); expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'You do not have permission to access this finance section.');
  expect(screen.queryByRole('button', { name: /Create Invoice/ })).toBeNull();
});
test('invoice type is the first creation option and switching brands clears GST',async()=>{mount(<FinanceForm mode="invoice" metadata={metadata} onClose={vi.fn()}/>);const select=screen.getByRole('combobox',{name:'Invoice type'});expect(document.querySelector('form select')).toBe(select);fireEvent.change(select,{target:{value:'GST'}});expect(screen.getByLabelText('Tax Rate 1').value).toBe('18');fireEvent.change(select,{target:{value:'NON_GST'}});expect(screen.getByLabelText('Tax Rate 1').value).toBe('0');expect(screen.getByLabelText('Tax Rate 1').disabled).toBe(true);});
