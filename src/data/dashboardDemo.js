export const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
export const revenue = [
  { month: 'Jul', revenue: 85000, expenses: 62000 },
  { month: 'Aug', revenue: 106000, expenses: 78000 },
  { month: 'Sep', revenue: 115000, expenses: 85000 },
  { month: 'Oct', revenue: 140000, expenses: 92000 },
  { month: 'Nov', revenue: 162420, expenses: 98210 },
  { month: 'Dec', revenue: 159000, expenses: 111000 },
];
export const clients = [
  { name: 'Active', value: 24, color: '#006eb5' },
  { name: 'Onboarding', value: 8, color: '#5dbdff' },
  { name: 'Inactive', value: 4, color: '#b8e0ff' },
];
export const invoices = [
  {
    id: 'INV-1032',
    client: 'Globex Ltd',
    project: 'Website Redesign',
    issue: '12 Dec 2025',
    due: '26 Dec 2025',
    amount: 12480,
    status: 'Paid',
  },
  {
    id: 'INV-1031',
    client: 'Acme Corp',
    project: 'Mobile App',
    issue: '10 Dec 2025',
    due: '24 Dec 2025',
    amount: 8750,
    status: 'Pending',
  },
  {
    id: 'INV-1030',
    client: 'Zenith Inc',
    project: 'ERP Implementation',
    issue: '08 Dec 2025',
    due: '22 Dec 2025',
    amount: 15200,
    status: 'Sent',
  },
  {
    id: 'INV-1029',
    client: 'Metro Solutions',
    project: 'Support & Maintenance',
    issue: '05 Dec 2025',
    due: '20 Dec 2025',
    amount: 4990,
    status: 'Paid',
  },
  {
    id: 'INV-1028',
    client: 'Nova Tech',
    project: 'CRM Customization',
    issue: '02 Dec 2025',
    due: '16 Dec 2025',
    amount: 9600,
    status: 'Overdue',
  },
];
export const activities = [
  {
    icon: 'project',
    title: 'New project created',
    detail: 'Website Redesign for Acme Corp',
    time: '2h ago',
  },
  {
    icon: 'payment',
    title: 'Invoice INV-1032 marked as paid',
    detail: '₹12,480 received from Globex Ltd',
    time: '4h ago',
  },
  {
    icon: 'leave',
    title: 'Employee leave request',
    detail: 'Dec 24 – Dec 28 · 5 days',
    time: '6h ago',
  },
  {
    icon: 'client',
    title: 'New client added',
    detail: 'Metro Solutions Pvt. Ltd.',
    time: '8h ago',
  },
  {
    icon: 'task',
    title: 'Task completed',
    detail: 'UI Design – Dashboard Module',
    time: '1d ago',
  },
];
export const tasks = [
  {
    title: 'Prepare monthly financial report',
    department: 'Finance',
    due: 'Today',
    initials: 'AK',
  },
  {
    title: 'Client meeting – Acme Corp',
    department: 'Client Relations',
    due: 'Tomorrow',
    initials: 'SR',
  },
  {
    title: 'Review project milestones',
    department: 'Project Management',
    due: 'Upcoming',
    initials: 'RK',
  },
  {
    title: 'Send invoice to Zenith Inc',
    department: 'Accounting',
    due: 'Upcoming',
    initials: 'PM',
  },
  {
    title: 'Team performance review',
    department: 'HR',
    due: 'Upcoming',
    initials: 'AS',
  },
];
