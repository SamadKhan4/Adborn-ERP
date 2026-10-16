import ManagementStats from '../components/common/ManagementStats.jsx';
import '../styles/userManagement.css';
import { downloadJSON } from '../lib/download.js';
import DeleteAccountDialog from '../components/hrms/DeleteAccountDialog.jsx';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  CheckCircle2,
  Layers3,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserX,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import HRMSDialog from '../components/hrms/HRMSDialog.jsx';
import { Button } from '../components/ui/Button.jsx';

const roleOptions = {
  super_admin: ['admin', 'manager', 'hr'],
  admin: ['manager', 'hr'],
  manager: ['hr'],
};
const inputClass =
  'mt-1.5 min-h-11 w-full rounded-xl border border-[#dce7f0] bg-white px-3 text-xs text-[#173958] outline-none focus:border-[#0987C4] focus:ring-4 focus:ring-[#0987c414]';
const pretty = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function generatePassword() {
  const characters =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const values = new Uint32Array(16);
  globalThis.crypto.getRandomValues(values);
  return [...values]
    .map((value) => characters[value % characters.length])
    .join('');
}

function UserForm({ user = null, open, onOpenChange }) {
  const actorRole = useAuthStore((state) => state.user.role);
  const roles = roleOptions[actorRole] || [];
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || roles[0] || '',
    temporaryPassword: '',
  }));
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () =>
      (
        await (user
          ? api.patch(`/user-management/${user._id}`, {
              name: form.name,
              email: form.email,
              role: form.role,
            })
          : api.post('/user-management', form))
      ).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-management'] });
      onOpenChange(false);
    },
  });
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const error =
    mutation.error?.response?.data?.error?.message || mutation.error?.message;
  return (
    <HRMSDialog
      open={open}
      onOpenChange={onOpenChange}
      title={user ? 'Edit managed user' : 'Create managed user'}
      description={`You can assign: ${roles.map(pretty).join(', ')}.`}
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <label className="text-[11px] font-semibold text-[#31516f]">
          Name
          <input
            className={inputClass}
            required
            value={form.name}
            onChange={update('name')}
            autoFocus
          />
        </label>
        <label className="text-[11px] font-semibold text-[#31516f]">
          Email
          <input
            className={inputClass}
            required
            type="email"
            value={form.email}
            onChange={update('email')}
          />
        </label>
        <label className="text-[11px] font-semibold text-[#31516f]">
          Role
          <select
            aria-label="Managed user role"
            className={inputClass}
            value={form.role}
            onChange={update('role')}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {pretty(role)}
              </option>
            ))}
          </select>
        </label>
        {!user && (
          <label className="text-[11px] font-semibold text-[#31516f]">
            Temporary password
            <span className="relative block">
              <input
                aria-label="Managed user temporary password"
                className={`${inputClass} pr-11`}
                required
                minLength="12"
                type={showPassword ? 'text' : 'password'}
                value={form.temporaryPassword}
                onChange={update('temporaryPassword')}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute bottom-1 right-1 grid size-9 cursor-pointer place-items-center rounded-lg text-[#607b94] hover:bg-[#edf6fc]"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
            <button
              type="button"
              className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[10px] font-semibold text-[#006EB5]"
              onClick={() => {
                setForm((current) => ({
                  ...current,
                  temporaryPassword: generatePassword(),
                }));
                setShowPassword(true);
              }}
            >
              <RefreshCw size={13} /> Generate
            </button>
          </label>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49] sm:col-span-2"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-[#edf2f6] pt-4 sm:col-span-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? 'Saving…'
              : user
                ? 'Save user'
                : 'Create user'}
          </Button>
        </div>
      </form>
    </HRMSDialog>
  );
}

export default function UserManagement() {
  const actor = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deactivateUser, setDeactivateUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['user-management'],
    queryFn: async ({ signal }) =>
      (await api.get('/user-management', { signal })).data.data.items,
    staleTime: 30000,
  });
  const deactivate = useMutation({
    mutationFn: async (user) =>
      (await api.delete(`/user-management/${user._id}`)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-management'] });
      setDeactivateUser(null);
    },
  });
  const reactivate = useMutation({
    mutationFn: async (user) =>
      (await api.patch(`/user-management/${user._id}`, { active: true })).data,
    onSuccess: () => queryClient.invalidateQueries(),
  });
  const rows = (query.data || []).filter(
    (user) =>
      (!status || String(user.active) === status) &&
      (!role || user.role === role) &&
      `${user.name} ${user.email} ${user.role}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="management-page user-management-page mx-auto w-full max-w-[1500px]">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#e6f4fd] px-3 py-1 text-[10px] font-bold text-[#006EB5]">
            <ShieldCheck size={13} /> ACCESS CONTROL
          </span>
          <h1 className="text-2xl font-bold tracking-[-0.035em] text-[#0d2344] sm:text-3xl">
            User Management
          </h1>
          <p className="mt-1 text-xs text-[#6d8197]">
            Create and manage Admin, Manager and HR access outside HRMS.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            <RefreshCw size={15} />
            Refresh users
          </Button>
          <Button
            variant="secondary"
            disabled={!rows.length}
            onClick={() =>
              downloadJSON(
                'adborn-managed-users.json',
                rows.map(({ name, email, role, active }) => ({
                  name,
                  email,
                  role,
                  active,
                })),
              )
            }
          >
            <Download size={15} />
            Export list
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Add User
          </Button>
        </div>
      </div>
      <ManagementStats
        items={[
          {
            label: 'Managed users',
            value: query.data?.length ?? '-',
            caption: 'All managed accounts',
            icon: UsersRound,
            tone: 'blue',
            onClick: () => setStatus(''),
            selected: !status,
          },
          {
            label: 'Active users',
            value: query.data?.filter((user) => user.active).length ?? '-',
            caption: 'Can sign in',
            icon: CheckCircle2,
            tone: 'green',
            onClick: () => setStatus('true'),
            selected: status === 'true',
          },
          {
            label: 'Inactive users',
            value: query.data?.filter((user) => !user.active).length ?? '-',
            caption: 'Access disabled',
            icon: UserX,
            tone: 'rose',
            onClick: () => setStatus('false'),
            selected: status === 'false',
          },
          {
            label: 'Roles in use',
            value: query.data
              ? new Set(query.data.map((user) => user.role)).size
              : '-',
            caption: 'Within your management scope',
            icon: Layers3,
            tone: 'purple',
          },
        ]}
      />
      <p className="mb-4 text-xs text-slate-500">
        Your creation access:{' '}
        {(roleOptions[actor.role] || []).map(pretty).join(' / ')}
      </p>
      <div className="directory-tools">
        <select
          aria-label="Managed user status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select
          aria-label="Managed user role filter"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="">All roles</option>
          {(roleOptions[actor.role] || []).map((value) => (
            <option key={value} value={value}>
              {pretty(value)}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">
          {rows.length} matching accounts
        </span>
        {(status || role || search) && (
          <button
            onClick={() => {
              setStatus('');
              setRole('');
              setSearch('');
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      {reactivate.isError && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700"
        >
          {reactivate.error.response?.data?.error?.message ||
            'Unable to reactivate account.'}
        </p>
      )}
      <section className="rounded-[20px] border border-[#e8eff5] bg-white p-4 shadow-[0_10px_32px_#315d860b]">
        <label className="mb-4 flex min-h-11 max-w-md items-center gap-2 rounded-xl border border-[#dfe8f2] px-3 text-[#7890a7] focus-within:border-[#0987C4]">
          <Search size={16} />
          <input
            aria-label="Search managed users"
            className="w-full bg-transparent text-xs outline-none"
            placeholder="Search name, email or role"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        {query.isPending ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-12 animate-pulse rounded-xl bg-[#f1f5f9]"
              />
            ))}
          </div>
        ) : query.isError ? (
          <p
            role="alert"
            className="rounded-xl bg-[#fff1f2] p-4 text-xs text-[#b53e49]"
          >
            Unable to load managed users.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="bg-[#f6f9fd] text-[9px] text-[#6e8097]">
                  {['User', 'Email', 'Role', 'Status', 'Actions'].map(
                    (label) => (
                      <th
                        key={label}
                        className={`px-3 py-3 font-semibold ${label === 'Actions' ? 'text-right' : ''}`}
                      >
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-[#eff3f7] last:border-0"
                  >
                    <td className="px-3 py-3 text-[11px] font-semibold text-[#173653]">
                      {user.name}
                    </td>
                    <td className="px-3 py-3 text-[10px] text-[#5d7089]">
                      {user.email}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-lg bg-[#e8f5fd] px-2.5 py-1.5 text-[9px] font-semibold text-[#006EB5]">
                        {pretty(user.role)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-lg px-2.5 py-1.5 text-[9px] font-semibold ${user.active ? 'bg-[#e4f8ed] text-[#07885b]' : 'bg-[#fff0f0] text-[#d44852]'}`}
                      >
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${user.name}`}
                          className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#006EB5] hover:bg-[#eaf5fc]"
                          onClick={() => setEditUser(user)}
                        >
                          <Pencil size={14} />
                        </button>
                        {!user.active && (
                          <button
                            type="button"
                            aria-label={`Reactivate ${user.name}`}
                            disabled={reactivate.isPending}
                            onClick={() => reactivate.mutate(user)}
                            className="grid size-8 cursor-pointer place-items-center rounded-lg text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                        {user.active && (
                          <button
                            type="button"
                            aria-label={`Deactivate ${user.name}`}
                            className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#c14851] hover:bg-[#fff0f1]"
                            onClick={() => setDeactivateUser(user)}
                          >
                            <UserX size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Delete ${user.name}`}
                          className="grid size-8 cursor-pointer place-items-center rounded-lg text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteUser(user)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <p className="py-12 text-center text-xs text-[#71859a]">
                No managed users found.
              </p>
            )}
          </div>
        )}
      </section>
      {deleteUser && (
        <DeleteAccountDialog
          key={deleteUser._id}
          account={deleteUser}
          endpoint="/user-management"
          onClose={() => setDeleteUser(null)}
        />
      )}
      {createOpen && <UserForm open onOpenChange={setCreateOpen} />}
      <UserForm
        key={editUser?._id || 'managed-user-editor'}
        user={editUser}
        open={Boolean(editUser)}
        onOpenChange={(open) => !open && setEditUser(null)}
      />
      <HRMSDialog
        open={Boolean(deactivateUser)}
        onOpenChange={(open) => !open && setDeactivateUser(null)}
        title="Deactivate user"
        description="This immediately blocks the user's ERP access."
      >
        <p className="rounded-xl bg-[#fff5f5] p-4 text-xs text-[#8e3d44]">
          Deactivate <strong>{deactivateUser?.name}</strong>?
        </p>
        {deactivate.isError && (
          <p role="alert" className="mt-3 text-xs text-[#b53e49]">
            {deactivate.error.response?.data?.error?.message ||
              'Unable to deactivate user.'}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeactivateUser(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => deactivate.mutate(deactivateUser)}
            disabled={deactivate.isPending}
          >
            {deactivate.isPending ? 'Deactivating…' : 'Deactivate'}
          </Button>
        </div>
      </HRMSDialog>
    </div>
  );
}
