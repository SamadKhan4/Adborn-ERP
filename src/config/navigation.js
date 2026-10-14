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
} from 'lucide-react';
export const navigation = [
  {
    label: 'My Dashboard',
    path: '/employee',
    icon: CircleUserRound,
    allowedRoles: ['employee', 'executive'],
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
  { label: 'CRM', path: '/crm', icon: ContactRound, permission: 'crm.read' },
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
  {
    label: 'Projects',
    path: '/projects',
    icon: FolderKanban,
    permission: 'projects.read',
  },
];
export const canView = (user, item) =>
  item.allowedRoles
    ? item.allowedRoles.includes(user.role)
    : item.path === '/' ||
      item.path === '/departments' ||
      user.role === 'super_admin' ||
      user.permissions?.includes(item.permission) ||
      (item.label === 'HRMS' && user.permissions?.includes('hrms.self'));

export const defaultRouteForRole = (role) => {
  if (['super_admin', 'admin', 'manager'].includes(role)) return '/';
  if (['hr', 'team_leader'].includes(role)) return '/hrms/dashboard';
  if (['employee', 'executive'].includes(role)) return '/employee';
  return '/departments';
};
