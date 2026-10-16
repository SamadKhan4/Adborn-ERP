import {
  LayoutDashboard,
  UsersRound,
  ContactRound,
  FolderKanban,
  FileText,
  WalletCards,
  ChartNoAxesCombined,
  Building2,
  PhoneCall,
  Files,
  ShieldCheck,
  CircleUserRound,
  Mail,
} from 'lucide-react';
export const navigation = [
  { label: 'Team Workspace', path: '/team', icon: FolderKanban, allowedRoles: ['team_leader'] },
  { label: 'My Team Work', path: '/my-work', icon: CircleUserRound, allowedRoles: ['employee', 'executive', 'lead_caller', 'team_leader'] },
  {
    label: 'My Dashboard',
    path: '/employee',
    icon: CircleUserRound,
    allowedRoles: ['employee', 'executive', 'team_leader'],
  },
  {
    label: 'Overview',
    path: '/',
    icon: LayoutDashboard,
    allowedRoles: ['super_admin', 'admin', 'manager'],
  },
  {
    label: 'HRMS',
    path: '/hrms/dashboard',
    matchPrefix: '/hrms',
    icon: UsersRound,
    permission: 'hrms.read',
  },
  {
    label: 'User Management',
    path: '/user-management',
    icon: ShieldCheck,
    allowedRoles: ['super_admin', 'admin', 'manager'],
  },
  {
    label: 'Employee Management',
    path: '/hrms/employees',
    icon: UsersRound,
    allowedRoles: ['super_admin', 'admin', 'manager', 'hr'],
  },
  { label: 'CRM', path: '/crm', icon: ContactRound, permission: 'crm.dashboard.view' },
  {
    label: 'Quotations',
    path: '/quotations',
    icon: Files,
    permission: 'quotations.read',
  },
  {
    label: 'Invoices',
    path: '/invoices',
    icon: FileText,
    permission: 'invoices.read',
  },
  {
    label: 'Finance',
    path: '/finance',
    icon: WalletCards,
    permission: 'finance.read',
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: ChartNoAxesCombined,
    permission: 'reports.read',
  },
  {
    label: 'Departments',
    path: '/departments',
    icon: Building2,
    allowedRoles: ['super_admin', 'admin', 'manager', 'hr'],
  },
  { label: 'Leads', path: '/leads', icon: PhoneCall, permission: 'leads.read' },
  { label: 'My Mails', path: '/my-mails', icon: Mail, allowedRoles: ['super_admin', 'admin', 'manager', 'hr', 'executive', 'team_leader', 'employee', 'lead_caller', 'customer'] },
  {
    label: 'Projects',
    path: '/projects',
    icon: FolderKanban,
    permission: 'projects.read',
  },
];
export const canView = (user, item) =>
  user.role === 'team_leader' && ['CRM', 'HRMS'].includes(item.label) ? false : item.label === 'CRM' ? user.role === 'super_admin' || user.permissions?.some((permission) => permission.startsWith('crm.')) : item.allowedRoles
    ? item.allowedRoles.includes(user.role)
    : item.path === '/' ||
      item.path === '/departments' ||
      user.role === 'super_admin' ||
      user.permissions?.includes(item.permission) ||
      (item.label === 'HRMS' && user.role !== 'executive' && user.permissions?.includes('hrms.self'));

export const defaultRouteForRole = (role) => {
  if (['super_admin', 'admin', 'manager'].includes(role)) return '/';
  if (role === 'team_leader') return '/employee';
  if (role === 'hr') return '/hrms/dashboard';
  if (['employee', 'executive'].includes(role)) return '/employee';
  return '/departments';
};
