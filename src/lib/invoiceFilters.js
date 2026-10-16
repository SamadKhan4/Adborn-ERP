import { indiaDate } from './dashboardFormat.js';
export const invoiceIsOverdue = (invoice) =>
  !['Paid', 'Draft', 'Cancelled'].includes(invoice.status) &&
  Boolean(invoice.dueDate) &&
  new Date(invoice.dueDate) < new Date(`${indiaDate()}T00:00:00+05:30`);
export const invoiceMatchesStatus = (invoice, status) =>
  !status ||
  (status === 'Outstanding'
    ? !['Paid', 'Draft', 'Cancelled'].includes(invoice.status)
    : status === 'Overdue'
      ? invoiceIsOverdue(invoice)
      : invoice.status === status);
