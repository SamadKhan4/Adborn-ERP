import { tw } from '../../lib/tailwind.js';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, MoreHorizontal } from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
import Modal from '../common/Modal.jsx';
import { invoices, currency } from '../../data/dashboardDemo.js';
export default function RecentInvoices() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All Status');
  const [selected, setSelected] = useState(null);
  const rows = invoices.filter(
    (row) =>
      (status === 'All Status' || row.status === status) &&
      `${row.id} ${row.client} ${row.project}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <SectionCard
      title="Recent Invoices"
      icon={FileText}
      className={tw('invoices-card')}
      actions={
        <>
          <Link to="/invoices">View all</Link>
          <label className={tw('search-field')}>
            <Search size={17} />
            <input
              aria-label="Search demo invoices"
              placeholder="Search invoices…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            aria-label="Invoice status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {['All Status', 'Paid', 'Pending', 'Sent', 'Overdue'].map(
              (value) => (
                <option key={value}>{value}</option>
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
              <tr key={row.id}>
                <td className={tw('invoice-id')}>{row.id}</td>
                <td>
                  <span className={tw('client-cell')}>
                    <span className={tw('client-avatar')}>{row.client[0]}</span>
                    {row.client}
                  </span>
                </td>
                <td>{row.project}</td>
                <td>{row.issue}</td>
                <td>{row.due}</td>
                <td className={tw('invoice-amount')}>{currency(row.amount)}</td>
                <td>
                  <span
                    className={tw(`status-badge ${row.status.toLowerCase()}`)}
                  >
                    <i />
                    {row.status}
                  </span>
                </td>
                <td>
                  <button
                    className={tw('table-action')}
                    aria-label={`Preview ${row.id}`}
                    onClick={() => setSelected(row)}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className={tw('empty-state')}>
            No demo invoices match your filters.
          </p>
        )}
      </div>
      {selected && (
        <Modal label="Demo invoice preview" onClose={() => setSelected(null)}>
          <h2>{selected.id} · Demo preview</h2>
          <p>
            {selected.client} — {selected.project}
          </p>
          <strong>{currency(selected.amount)}</strong>
          <p>Demonstration only. Invoice management is coming soon.</p>
          <button autoFocus onClick={() => setSelected(null)}>
            Close preview
          </button>
        </Modal>
      )}
    </SectionCard>
  );
}
