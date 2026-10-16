import { tw } from '../../lib/tailwind.js';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search } from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
import { currency, displayDate } from '../../lib/dashboardFormat.js';
export default function RecentInvoices({ invoices = [] }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const rows = invoices.filter(
    (row) =>
      (!status || row.status === status) &&
      `${row.invoiceNumber} ${row.client?.company}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <SectionCard
      title="Recent Invoices"
      subtitle="Latest 8 invoices"
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
                'Issue Date',
                'Due Date',
                'Amount',
                'Status',
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
                <td>{row.client?.company || '-'}</td>
                <td>{displayDate(row.invoiceDate)}</td>
                <td>{displayDate(row.dueDate)}</td>
                <td className={tw('invoice-amount')}>
                  {currency(row.grandTotal)}
                </td>
                <td>
                  <span
                    className={tw(`status-badge ${row.status.toLowerCase()}`)}
                  >
                    {row.status}
                  </span>
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
