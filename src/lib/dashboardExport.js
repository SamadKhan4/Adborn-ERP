export function overviewCSV(data) {
  const rows = [
    ['Section', 'Metric', 'Value', 'Basis'],
    ['Snapshot', 'Generated at', data.generatedAt, 'UTC'],
    ['Attendance', 'Date', data.date, 'Asia/Kolkata'],
    ...Object.entries(data.finance).map(([key, value]) => [
      'Finance',
      key,
      value,
      key === 'overdueCount' ? 'Invoices' : 'INR',
    ]),
    ...Object.entries(data.attendance).map(([key, value]) => [
      'Attendance',
      key,
      value,
      'Selected date / current active staff',
    ]),
    ...Object.entries(data.projects).map(([key, value]) => [
      'Projects',
      key,
      value,
      'Current records',
    ]),
    ...Object.entries(data.leads).map(([key, value]) => [
      'Leads',
      key,
      value,
      'Current records',
    ]),
    ...Object.entries(data.taskSummary).map(([key, value]) => [
      'Team tasks',
      key,
      value,
      'Current records',
    ]),
    ['CRM', 'Clients', data.clients, 'Current records'],
    ['Approvals', 'Pending leaves', data.pendingLeaves, 'Current records'],
    ['CRM', 'Overdue follow-ups', data.overdueFollowups, 'Current records'],
    ...data.revenue.flatMap((month) => [
      [
        'Invoice trend',
        `${month.month} billed`,
        month.billed,
        'INR by invoice month',
      ],
      [
        'Invoice trend',
        `${month.month} paid`,
        month.paid,
        'INR by invoice month / current paid status',
      ],
    ]),
  ];
  return rows
    .map((row) =>
      row
        .map((value) => {
          let text = String(value ?? '');
          if (/^[=+@\t\r-]/.test(text)) text = "'" + text;
          return '"' + text.replaceAll('"', '""') + '"';
        })
        .join(','),
    )
    .join('\r\n');
}
export function downloadOverview(data) {
  const url = URL.createObjectURL(
    new Blob([overviewCSV(data)], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `adborn-overview-${data.date}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
