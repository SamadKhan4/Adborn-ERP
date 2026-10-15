import {
  LayoutDashboard,
  UsersRound,
  Building2,
  UserSearch,
  UserPlus,
  UserMinus,
  CalendarCheck2,
  CalendarDays,
  Clock3,
  Palmtree,
  WalletCards,
  ChartNoAxesCombined,
  PackageCheck,
  Files,
  Megaphone,
  FileChartColumn,
  Settings2,
} from 'lucide-react';

export const hrmsGroups = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { label: 'HR Dashboard', path: '/hrms/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 'people',
    label: 'People Management',
    items: [
      { label: 'Employees', path: '/hrms/employees', icon: UsersRound },
      { label: 'Departments & Designations', path: '/hrms/departments', icon: Building2 },
      { label: 'Recruitment', path: '/hrms/recruitment', icon: UserSearch },
      { label: 'Onboarding', path: '/hrms/onboarding', icon: UserPlus },
      { label: 'Offboarding', path: '/hrms/offboarding', icon: UserMinus },
    ],
  },
  {
    id: 'workforce',
    label: 'Workforce Management',
    items: [
      { label: 'Attendance', path: '/hrms/attendance', icon: CalendarCheck2 },
      { label: 'Leave Management', path: '/hrms/leave', icon: CalendarDays },
      { label: 'Shifts & Timesheets', path: '/hrms/shifts', icon: Clock3 },
      { label: 'Holidays', path: '/hrms/holidays', icon: Palmtree },
    ],
  },
  {
    id: 'payroll',
    label: 'Payroll & Performance',
    items: [
      { label: 'Payroll', path: '/hrms/payroll', icon: WalletCards },
      { label: 'Performance Reviews', path: '/hrms/performance', icon: ChartNoAxesCombined },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    items: [
      { label: 'Asset Management', path: '/hrms/assets', icon: PackageCheck },
      { label: 'Documents & Policies', path: '/hrms/documents', icon: Files },
      { label: 'Announcements', path: '/hrms/announcements', icon: Megaphone },
      { label: 'HR Reports', path: '/hrms/reports', icon: FileChartColumn },
      { label: 'HRMS Settings', path: '/hrms/settings', icon: Settings2 },
    ],
  },
];

export const hrmsItems = hrmsGroups.flatMap((group) => group.items);
export const hrmsPageBySlug = Object.fromEntries(
  hrmsItems.map((item) => [item.path.split('/').at(-1), item]),
);
