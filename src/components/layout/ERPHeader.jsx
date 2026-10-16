import { tw } from '../../lib/tailwind.js';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Settings,
  ChevronDown,
  Menu,
  X,
  LogOut,
  UserRound,
  CheckCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { navigation, canView } from '../../config/navigation.js';
import DraggableNavigation from './DraggableNavigation.jsx';
import { api } from '../../services/api.js';
import CRMGlobalSearch from '../crm/CRMGlobalSearch.jsx';
import '../../styles/navigationDepth.css';

export default function ERPHeader() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [menu, setMenu] = useState(null);
  const queryClient = useQueryClient();
  const notificationQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async ({ signal }) => (await api.get('/notifications', { signal })).data.data,
    enabled: Boolean(user),
    staleTime: 15000,
    refetchInterval: 30000,
  });
  const markRead = useMutation({
    mutationFn: async (id) => (await api.patch(`/notifications/${id}/read`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAllRead = useMutation({
    mutationFn: async () => (await api.patch('/notifications/read-all')).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const toggle = (name) => setMenu(menu === name ? null : name);
  // The current API returns roles only. Never infer grants for non-super-admins.
  const items = navigation.filter((item) => canView(user, item)).map((item) => item.label === 'HRMS' && user.permissions?.includes('hrms.self') && !user.permissions?.includes('hrms.read') ? { ...item, path: '/hrms/onboarding' } : item);
  if (user.role === 'team_leader') {
    const order = { '/employee': 0, '/my-work': 1, '/team': 2 };
    items.sort((left, right) => (order[left.path] ?? 99) - (order[right.path] ?? 99));
  }
  const initials = user.name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('');
  const notifications = notificationQuery.data?.items || [];
  const unreadCount = notificationQuery.data?.unreadCount || 0;
  return (
    <header
      className={`${tw('erp-header')} min-w-0 max-md:flex-wrap`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setMenu(null);
      }}
    >
      <Link className={tw('brand')} to="/" aria-label="AdBorn ERP home">
        <img src="/adborn-mark.png" alt="" className={tw('brand-mark')} />
        <span className={tw('brand-name')}>
          AdBorn<span> ERP</span>
        </span>
      </Link>
      <DraggableNavigation items={items} />
      <div className={tw('header-utilities')}>
        <button
          className={tw('icon-button mobile-trigger')}
          aria-label="Open navigation"
          aria-expanded={menu === 'navigation'}
          onClick={() => toggle('navigation')}
        >
          <Menu size={20} />
        </button>
        {[
          { name: 'search', label: 'Search', Icon: Search },
          { name: 'notifications', label: 'Notifications', Icon: Bell },
          { name: 'settings', label: 'Settings', Icon: Settings },
        ].map(({ name, label, Icon }) => (
          <button
            key={name}
            className={`${tw('icon-button utility-button')} relative`}
            aria-label={label}
            aria-expanded={menu === name}
            onClick={() => toggle(name)}
          >
            <Icon size={19} />
            {name === 'notifications' && unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#ef4254] px-1 text-[8px] font-bold leading-none text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
        ))}
        <button
          className={tw('profile-trigger')}
          onClick={() => toggle('profile')}
          aria-label="Open profile menu"
          aria-expanded={menu === 'profile'}
        >
          <span className={tw('avatar')}>{initials}</span>
          <ChevronDown size={17} />
        </button>
      </div>
      {menu && (
        <>
          <button
            className={tw('menu-backdrop')}
            aria-label="Close menu"
            onClick={() => setMenu(null)}
          />
          <div
            className={tw(
              `header-popover ${menu === 'navigation' ? 'mobile-menu' : ''}`,
            )}
          >
            <button
              className={tw('popover-close icon-button')}
              aria-label="Close menu"
              onClick={() => setMenu(null)}
            >
              <X size={16} />
            </button>
            {menu === 'navigation' ? (
              <nav aria-label="Mobile navigation">
                {items.map(({ label, path, matchPrefix, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    end={path === '/'}
                    className={({ isActive }) =>
                      isActive ||
                      (matchPrefix &&
                        location.pathname.startsWith(`${matchPrefix}/`))
                        ? 'active'
                        : undefined
                    }
                    onClick={() => setMenu(null)}
                  >
                    <Icon size={18} />
                    {label}
                  </NavLink>
                ))}
              </nav>
            ) : menu === 'notifications' ? (
              <div className="-m-2">
                <div className="mb-3 flex items-center justify-between px-2 pr-7">
                  <h3 className="!mb-0">Notifications</h3>
                  {unreadCount > 0 && <button type="button" className="inline-flex cursor-pointer items-center gap-1 text-[9px] font-semibold text-[#0677bd]" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}><CheckCheck size={13} />Mark all read</button>}
                </div>
                {notificationQuery.isPending ? <p role="status" className="px-2 py-5 text-center">Loading notificationsâ€¦</p> : notificationQuery.isError ? <p role="alert" className="rounded-xl bg-[#fff1f2] px-3 py-4 text-[#b53e49]">Unable to load notifications.</p> : notifications.length ? <div className="max-h-[360px] space-y-1 overflow-y-auto">
                  {notifications.map((notification) => <Link
                    key={notification._id}
                    to={notification.link || '#'}
                    className={`block rounded-xl border p-3 transition-colors ${notification.readAt ? 'border-transparent bg-white' : 'border-[#d8ebf7] bg-[#f2f9fd]'}`}
                    onClick={() => {
                      if (!notification.readAt) markRead.mutate(notification._id);
                      setMenu(null);
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 size-2 shrink-0 rounded-full ${notification.readAt ? 'bg-[#cbd5df]' : 'bg-[#0787d1]'}`} />
                      <div className="min-w-0">
                        <strong className="block text-[10px] text-[#183553]">{notification.title}</strong>
                        <p className="mt-1 !text-[9px] !leading-4">{notification.message}</p>
                        <time className="mt-1 block text-[8px] text-[#8a99aa]">{new Date(notification.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time>
                      </div>
                    </div>
                  </Link>)}
                </div> : <p className="px-2 py-7 text-center">No notifications yet.</p>}
              </div>
            ) : menu === 'search' ? <CRMGlobalSearch onNavigate={() => setMenu(null)} /> : menu === 'profile' ? (
              <>
                <div className={tw('profile-info')}>
                  <UserRound size={20} />
                  <div>
                    <strong>{user.name}</strong>
                    <p>{user.email}</p>
                    <small>
                      {user.role.replaceAll('_', ' ')}
                      {user.department ? ` · ${user.department}` : ''}
                    </small>
                  </div>
                </div>
                <Link
                  className={tw('logout-link')}
                  to="/logout"
                  onClick={() => setMenu(null)}
                >
                  <LogOut size={17} />
                  Log out
                </Link>
              </>
            ) : (
              <>
                <h3>{menu[0].toUpperCase() + menu.slice(1)}</h3>
                <p>
                  This feature is coming soon. No backend integration is
                  available yet.
                </p>
              </>
            )}
          </div>
        </>
      )}
    </header>
  );
}
