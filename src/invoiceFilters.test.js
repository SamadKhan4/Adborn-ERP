import { expect, test } from 'vitest';
import { invoiceMatchesStatus } from './lib/invoiceFilters.js';
test('dashboard overdue and outstanding filters include unpaid sent invoices and exclude drafts, cancelled and paid', () => {
  const past = '2000-01-01';
  expect(
    invoiceMatchesStatus({ status: 'Sent', dueDate: past }, 'Overdue'),
  ).toBe(true);
  expect(
    invoiceMatchesStatus({ status: 'Sent', dueDate: '2099-01-01' }, 'Overdue'),
  ).toBe(false);
  expect(
    invoiceMatchesStatus(
      { status: 'Sent', dueDate: '2099-01-01' },
      'Outstanding',
    ),
  ).toBe(true);
  for (const status of ['Paid', 'Draft', 'Cancelled']) {
    expect(invoiceMatchesStatus({ status, dueDate: past }, 'Overdue')).toBe(
      false,
    );
    expect(invoiceMatchesStatus({ status, dueDate: past }, 'Outstanding')).toBe(
      false,
    );
  }
});

