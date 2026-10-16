import {
  invoiceIsOverdue,
  invoiceMatchesStatus,
} from '../../lib/invoiceFilters.js';
import { tw } from '../../lib/tailwind.js';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, MoreHorizontal } from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
import { currency, displayDate } from '../../lib/dashboardFormat.js';
export default function RecentInvoices({ invoices = [] }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const rows = invoices
    .map((row) => ({
      ...row,
      status: invoiceIsOverdue(row) ? 'Overdue' : row.status,
    }))
    .filter(
      (row) =>
        invoiceMatchesStatus(row, status) &&
        `${row.invoiceNumber} ${row.client?.company}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  return (
    <SectionCard
      title="Recent Invoices"
      subtitle="Latest invoices"
      icon={FileText}
      className={tw('invoices-card')}
      actions={
        <>
          <Link to="/invoices">View all</Link>
          <label className={tw('search-field')}>
            <Search size={17} />
            <input
              aria-label="Search recent invoices"
              placeholder="Search invoices"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            aria-label="Invoice status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {['', 'Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'].map(
              (value) => (
                <option key={value} value={value}>
                  {value || 'All Status'}
                </option>
              ),
            )}
          </select>
        </>
      }
    >
      <div className={tw('table-scroll')}>
        <table>
          <thead>
            <tr>
              {[
                'Invoice #',
                'Client',
                'Project',
                'Issue Date',
                'Due Date',
                'Amount',
                'Status',
                'Actions',
              ].map((title) => (
                <th key={title}>{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id}>
                <td>
                  <Link
                    className={tw('invoice-id')}
                    to={`/invoices?search=${encodeURIComponent(row.invoiceNumber)}`}
                  >
                    {row.invoiceNumber}
                  </Link>
                </td>
                <td>
                  <span className="reference-client-cell">
                    <span className="reference-client-avatar">
                      {row.client?.company?.[0] || '-'}
                    </span>
                    {row.client?.company || '-'}
                  </span>
                </td>
                <td>{row.project?.title || '-'}</td>
                <td>{displayDate(row.invoiceDate)}</td>
                <td>{displayDate(row.dueDate)}</td>
                <td className={tw('invoice-amount')}>
                  {currency(row.grandTotal)}
                </td>
                <td>
                  <span
                    className={tw(`status-badge ${row.status.toLowerCase()}`)}
                  >
                    <i />
                    {row.status}
                  </span>
                </td>
                <td>
                  <Link
                    className="reference-invoice-action"
                    aria-label={`Open ${row.invoiceNumber}`}
                    to={`/invoices?search=${encodeURIComponent(row.invoiceNumber)}`}
                  >
                    <MoreHorizontal size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className={tw('empty-state')}>No invoices match your filters.</p>
        )}
      </div>
    </SectionCard>
  );
}
