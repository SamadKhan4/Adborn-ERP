import { Activity, BriefcaseBusiness } from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
const percent = (value, total) =>
  total ? Math.min(100, Math.round((value / total) * 100)) : 0;
export default function OperatingHealth({ data }) {
  const totalTasks = Object.values(data.taskSummary).reduce(
    (sum, value) => sum + value,
    0,
  );
  const invoiced = data.finance.paid + data.finance.outstanding;
  const totalProjects = Object.values(data.projects).reduce(
    (sum, value) => sum + value,
    0,
  );
  const progress = [
    [
      'Invoices marked paid',
      data.finance.paid,
      invoiced,
      'green',
      invoiced
        ? `${percent(data.finance.paid, invoiced)}% of billed value`
        : 'No billed invoices',
    ],
    [
      'Daily report submissions',
      data.attendance.reports,
      data.attendance.employees,
      'purple',
      `${data.attendance.reports} reports / ${data.attendance.employees} active staff`,
    ],
    [
      'Tasks completed',
      data.taskSummary.DONE || 0,
      totalTasks,
      'blue',
      `${data.taskSummary.DONE || 0} of ${totalTasks} tasks`,
    ],
  ];
  return (
    <div className="mb-5 grid gap-4 lg:grid-cols-2">
      <SectionCard
        title="Operational Health"
        subtitle="Calculated from live records"
        icon={Activity}
      >
        <div className="summary-progress">
          {progress.map(([label, value, total, tone, caption]) => (
            <div key={label} data-tone={tone}>
              <label>
                <span>{label}</span>
                <strong>{caption}</strong>
              </label>
              <div
                className="summary-track"
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent(value, total)}
              >
                <div style={{ width: `${percent(value, total)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard
        title="Project Health"
        subtitle={`${totalProjects} total projects`}
        icon={BriefcaseBusiness}
      >
        <div className="summary-progress">
          {[
            ['Active', 'blue'],
            ['Planned', 'purple'],
            ['Completed', 'green'],
            ['On Hold', 'amber'],
            ['Cancelled', 'rose'],
          ].map(([status, tone]) => (
            <div key={status} data-tone={tone}>
              <label>
                <span>{status}</span>
                <strong>{data.projects[status] || 0}</strong>
              </label>
              <div className="summary-track">
                <div
                  style={{
                    width: `${percent(data.projects[status] || 0, totalProjects)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
