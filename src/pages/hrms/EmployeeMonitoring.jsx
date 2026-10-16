import { useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api.js';
import HRMSPageHeader from '../../components/hrms/HRMSPageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';

const panel = 'rounded-2xl border border-[#e5edf6] bg-white p-5 shadow-sm';
const readable = (value) =>
  String(value || 'Not assigned').replaceAll('_', ' ');
const date = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
    : '—';
const time = (value) =>
  value
    ? new Date(value).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      })
    : '—';
const hours = (value = 0) =>
  `${Math.floor(value / 60)}h ${Math.round(value % 60)}m`;

function Records({ title, items, children }) {
  return (
    <section className={panel}>
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {items.length ? (
        <div className="max-h-[520px] space-y-3 overflow-y-auto">
          {items.map((item) => (
            <article
              key={item._id}
              className="rounded-xl border border-[#e5edf6] p-4"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <strong className="text-xs">{item.title}</strong>
                <span className="rounded-full bg-[#eaf5fc] px-2 py-1 text-[10px] text-[#006eb5]">
                  {item.status}
                </span>
              </div>
              {children(item)}
            </article>
          ))}
        </div>
      ) : (
        <p className="py-6 text-xs text-slate-500">No records available.</p>
      )}
    </section>
  );
}

export default function EmployeeMonitoring() {
  const { id } = useParams();
  const { openHRMSNavigation } = useOutletContext();
  const [days, setDays] = useState(30);
  const query = useQuery({
    queryKey: ['employee-monitoring', id, days],
    queryFn: async ({ signal }) =>
      (
        await api.get(`/hrms/employees/${id}/monitoring`, {
          params: { days },
          signal,
        })
      ).data.data,
    refetchInterval: 60000,
  });
  const data = query.data;
  return (
    <div className="space-y-5">
      <HRMSPageHeader
        title="Employee Monitoring"
        description="Review individual attendance, work updates, and employment records."
        onOpenNavigation={openHRMSNavigation}
        actions={
          <Button
            variant="secondary"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw size={15} /> Refresh
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/hrms/employees"
          className="flex items-center gap-2 text-xs text-[#006eb5]"
        >
          <ArrowLeft size={15} /> All employees
        </Link>
        <label className="text-xs">
          Attendance & reports period{' '}
          <select
            aria-label="Monitoring period"
            className="ml-2 rounded-lg border bg-white p-2"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            {[7, 30, 90].map((value) => (
              <option key={value} value={value}>
                Last {value} days
              </option>
            ))}
          </select>
        </label>
      </div>
      {query.isPending ? (
        <p role="status">Loading employee monitoring…</p>
      ) : query.isError ? (
        <div role="alert" className={panel}>
          {query.error.response?.data?.error?.message ||
            'Unable to load employee monitoring.'}
          <Button
            className="ml-3"
            variant="secondary"
            onClick={() => query.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          <section className={panel}>
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold">{data.employee.name}</h1>
                <p className="mt-1 text-xs text-slate-500">
                  {data.employee.email} ·{' '}
                  {data.employee.profile?.employeeCode || 'No employee code'}
                </p>
              </div>
              <span className="text-xs font-semibold">
                {data.employee.active ? 'Active account' : 'Inactive account'}
              </span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
              {[
                ['Department', readable(data.employee.department)],
                [
                  'Designation',
                  data.employee.profile?.designation || 'Not assigned',
                ],
                ['Role', readable(data.employee.role)],
                [
                  'Reporting manager',
                  data.employee.profile?.manager?.name || 'Not assigned',
                ],
                ['Joined', date(data.employee.profile?.joiningDate)],
                [
                  'Employment type',
                  readable(data.employee.profile?.employmentType),
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="mt-1 capitalize">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[10px] text-slate-500">
              Updated {time(data.generatedAt)} IST · Refreshes every minute
            </p>
          </section>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ['Today', data.summary.todayStatus],
              ['Attendance days', data.summary.attendanceDays],
              ['Completed work hours', hours(data.summary.workedMinutes)],
              ['Report days', data.summary.reportedDays],
              ['Attendance days without report', data.summary.missingReports],
            ].map(([label, value]) => (
              <div key={label} className={panel}>
                <p className="text-[11px] text-slate-500">{label}</p>
                <strong className="mt-2 block text-lg text-[#006eb5]">
                  {value}
                </strong>
              </div>
            ))}
          </div>
          <section className={panel}>
            <h2 className="mb-4 text-sm font-semibold">Attendance history</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[570px] text-left text-xs">
                <thead>
                  <tr>
                    {[
                      'Date',
                      'Check-in',
                      'Check-out',
                      'Status',
                      'Work hours',
                    ].map((label) => (
                      <th key={label} className="bg-slate-50 p-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.attendance.map((record) => (
                    <tr key={record._id} className="border-t">
                      <td className="p-3">{date(record.data.date)}</td>
                      <td>{time(record.data.checkIn)}</td>
                      <td>{time(record.data.checkOut)}</td>
                      <td>{record.data.attendanceStatus || record.status}</td>
                      <td>{hours(record.data.minutesWorked)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.attendance.length && (
                <p className="py-6 text-xs text-slate-500">
                  No attendance recorded for this period.
                </p>
              )}
            </div>
          </section>
          <Records title="Daily work reports" items={data.reports}>
            {(record) => (
              <div className="mt-3 space-y-2 whitespace-pre-wrap break-words text-xs text-slate-600">
                <p className="text-[10px]">{date(record.data.date)}</p>
                <p>{record.data.summary}</p>
                {record.data.completedTasks?.length > 0 && (
                  <ul className="list-inside list-disc">
                    {record.data.completedTasks.map((task, index) => (
                      <li key={index}>{task}</li>
                    ))}
                  </ul>
                )}
                {record.data.blockers && (
                  <p>
                    <strong>Blockers: </strong>
                    {record.data.blockers}
                  </p>
                )}
                {record.data.tomorrowPlan && (
                  <p>
                    <strong>Next plan: </strong>
                    {record.data.tomorrowPlan}
                  </p>
                )}
              </div>
            )}
          </Records>
          <div className="grid gap-5 xl:grid-cols-2">
            <Records
              title="Recent leave requests (latest 30)"
              items={data.leaves}
            >
              {(record) => (
                <p className="mt-2 text-xs text-slate-600">
                  {readable(record.data.leaveType)} ·{' '}
                  {date(record.data.startDate)} – {date(record.data.endDate)}
                </p>
              )}
            </Records>
            <Records title="Assigned assets (latest 30)" items={data.assets}>
              {(record) => (
                <p className="mt-2 text-xs text-slate-600">
                  {record.data.assetCode ||
                    record.data.serialNumber ||
                    record.title}
                </p>
              )}
            </Records>
          </div>
          <Records
            title="Performance & goals (latest 30)"
            items={data.performance}
          >
            {(record) => (
              <div className="mt-2 space-y-2 text-xs text-slate-600">
                {record.data.description && <p>{record.data.description}</p>}
                {record.data.rating != null && (
                  <p>Rating: {record.data.rating}</p>
                )}
                <p>{date(record.effectiveDate || record.createdAt)}</p>
              </div>
            )}
          </Records>
        </>
      )}
    </div>
  );
}
