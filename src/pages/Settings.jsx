import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserRound,
  LockKeyhole,
  Mail,
  WalletCards,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import {
  financePanel as panel,
  financeInput as input,
  financeButton as button,
  has,
} from '../components/finance/FinanceShared.jsx';
export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user.name),
    [passwords, setPasswords] = useState({
      currentPassword: '',
      newPassword: '',
      confirm: '',
    }),
    [notice, setNotice] = useState('');
  const cache = useQueryClient(),
    navigate = useNavigate();
  const error = (e) =>
    setNotice(
      e.response?.data?.error?.message || 'Unable to save. Please retry.',
    );
  const profile = useMutation({
    mutationFn: () => api.patch('/users/me', { name: name.trim() }),
    onSuccess: ({ data }) => {
      useAuthStore
        .getState()
        .setSession({
          user: data.data,
          accessToken: useAuthStore.getState().accessToken,
        });
      setNotice('Profile updated.');
    },
    onError: error,
  });
  const password = useMutation({
    mutationFn: () => {
      if (passwords.newPassword !== passwords.confirm)
        throw new Error('Passwords do not match');
      return api.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
    },
    onSuccess: () => {
      useAuthStore.getState().clearAuth();
      cache.clear();
      navigate('/login', { replace: true });
    },
    onError: (e) => setNotice(e.response?.data?.error?.message || e.message),
  });
  const refresh = useMutation({
    mutationFn: () => api.get('/auth/me'),
    onSuccess: ({ data }) => {
      useAuthStore
        .getState()
        .setSession({
          user: data.data,
          accessToken: useAuthStore.getState().accessToken,
        });
      cache.invalidateQueries();
      setNotice('Account permissions refreshed.');
    },
    onError: error,
  });
  const allowed = (k) =>
    user.role === 'super_admin' || has(user.permissions, k);
  return (
    <main className="space-y-5 text-[#10264b]">
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-[#71859a]">
          Manage your profile, security and ERP preferences.
        </p>
      </header>
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm"
        >
          {notice}
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={panel}>
          <h2 className="mb-5 flex items-center gap-2 font-bold">
            <UserRound size={19} />
            My Profile
          </h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              profile.mutate();
            }}
          >
            <label className="block text-xs">
              Full name
              <input
                aria-label="Full name"
                className={input}
                required
                minLength={1}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block text-xs">
              Login email
              <input
                className={`${input} bg-slate-50`}
                readOnly
                value={user.email}
              />
            </label>
            <p className="text-xs text-[#71859a]">
              Role: {user.role.replaceAll('_', ' ')}
              {user.department ? ` · ${user.department}` : ''}
            </p>
            <button
              className={button}
              disabled={profile.isPending || !name.trim()}
            >
              {profile.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </section>
        <section className={panel}>
          <h2 className="mb-5 flex items-center gap-2 font-bold">
            <LockKeyhole size={19} />
            Password & Security
          </h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              password.mutate();
            }}
          >
            {[
              ['currentPassword', 'Current password'],
              ['newPassword', 'New password'],
              ['confirm', 'Confirm new password'],
            ].map(([key, title]) => (
              <label className="block text-xs" key={key}>
                {title}
                <input
                  aria-label={title}
                  className={input}
                  type="password"
                  required
                  autoComplete={
                    key === 'currentPassword'
                      ? 'current-password'
                      : 'new-password'
                  }
                  minLength={key === 'currentPassword' ? 1 : 12}
                  maxLength={128}
                  pattern={
                    key === 'currentPassword'
                      ? undefined
                      : '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{12,128}'
                  }
                  value={passwords[key]}
                  onChange={(e) =>
                    setPasswords((v) => ({ ...v, [key]: e.target.value }))
                  }
                />
              </label>
            ))}
            <p className="text-xs text-[#71859a]">
              Use at least 12 characters, uppercase, lowercase and a number.
              Changing your password signs you out of all sessions.
            </p>
            <button className={button} disabled={password.isPending}>
              Change Password
            </button>
          </form>
        </section>
      </div>
      <section className={panel}>
        <h2 className="mb-4 font-bold">Module Settings</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [
              'Mail settings',
              'Work email, signature and mailbox connections',
              '/mail/settings',
              Mail,
              'mail.use',
            ],
            [
              'Finance settings',
              'Company, GST, bank and approval settings',
              '/finance',
              WalletCards,
              'finance.settings.manage',
            ],
            [
              'CRM settings',
              'Manage CRM configuration',
              '/crm/settings',
              ShieldCheck,
              'crm.settings.manage',
            ],
          ]
            .filter(([, , , , permission]) => allowed(permission))
            .map(([title, description, path, Icon]) => (
              <Link
                className="rounded-xl border border-[#e0edf8] bg-[#f7fbff] p-4"
                to={path}
                key={path}
              >
                <Icon className="mb-2 text-[#087dda]" size={20} />
                <strong className="text-sm">{title}</strong>
                <p className="mt-2 text-xs text-[#71859a]">{description}</p>
              </Link>
            ))}
        </div>
        <button
          className={`${input} mt-5 !w-auto`}
          disabled={refresh.isPending}
          onClick={() => refresh.mutate()}
        >
          <RefreshCw size={14} className="mr-2 inline" />
          Refresh Account & Permissions
        </button>
      </section>
    </main>
  );
}
