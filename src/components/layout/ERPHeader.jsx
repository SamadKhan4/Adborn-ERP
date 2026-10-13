import { tw } from '../../lib/tailwind.js';
import { useState } from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { navigation, canView } from '../../config/navigation.js';
import DraggableNavigation from './DraggableNavigation.jsx';

export default function ERPHeader() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [menu, setMenu] = useState(null);
  const toggle = (name) => setMenu(menu === name ? null : name);
  // The current API returns roles only. Never infer grants for non-super-admins.
  const items = navigation.filter((item) => canView(user, item)).map((item) => item.label === 'HRMS' && user.permissions?.includes('hrms.self') && !user.permissions?.includes('hrms.read') ? { ...item, path: '/hrms/onboarding' } : item);
  const initials = user.name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('');
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
            className={tw('icon-button utility-button')}
            aria-label={label}
            aria-expanded={menu === name}
            onClick={() => toggle(name)}
          >
            <Icon size={19} />
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
            ) : menu === 'profile' ? (
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
