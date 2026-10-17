import { useQuery } from '@tanstack/react-query';
import HRMSDialog from '../hrms/HRMSDialog.jsx';
import { api } from '../../services/api.js';
import { FinanceState, money, label } from './FinanceShared.jsx';
export default function ExpenseDetail({ row, onClose, download }) {
  const query = useQuery({ queryKey: ['finance', 'expense', row._id], queryFn: async ({ signal }) => (await api.get(`/finance/expenses/${row._id}`, { signal })).data.data });
  return <HRMSDialog open title={row.expenseId} description="Expense details and securely stored receipt documents." onOpenChange={() => onClose()}><FinanceState query={query}>{query.data && <div className="space-y-5 text-xs"><p><strong>{query.data.expense.vendor}</strong> · {label(query.data.expense.status)}</p><p>{query.data.expense.description}</p><p>Base: {money(query.data.expense.amountMinor)} · Tax: {money(query.data.expense.taxMinor)} · Total: {money(query.data.expense.totalMinor)}</p><h3 className="font-bold">Receipts</h3>{query.data.documents.map((file) => <div className="flex justify-between rounded-xl border p-3" key={file._id}><span>{file.name}</span><button className="font-semibold text-[#087dda]" onClick={() => download({ path: `/documents/${file._id}`, name: file.name })}>Download</button></div>)}{!query.data.documents.length && <p>No receipts uploaded.</p>}</div>}</FinanceState></HRMSDialog>;
}
