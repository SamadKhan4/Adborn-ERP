import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import HRMSDialog from '../hrms/HRMSDialog.jsx';
import { api } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';
import {
  reportInput,
  reportButton,
  permitted,
  titleCase,
} from './ReportShared.jsx';
export function ReportSaveDialog({
  report,
  filters,
  columns,
  chart,
  permissions,
  onClose,
  existing,
}) {
  const [name, setName] = useState(existing?.name || report.title),
    [visibility, setVisibility] = useState(existing?.visibility || 'PRIVATE');
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      api[existing ? 'patch' : 'post'](
        existing ? `/reports/saved/${existing._id}` : '/reports/saved',
        {
          name,
          reportKey: report.key,
          filters,
          columns,
          chart,
          visibility,
          ...(filters.sort
            ? { sort: { field: filters.sort, order: filters.order || 'desc' } }
            : {}),
        },
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['reports'] });
      client.invalidateQueries({ queryKey: ['savedReports'] });
      onClose('Report view saved.');
    },
  });
  return (
    <HRMSDialog
      open
      onOpenChange={() => onClose()}
      title={existing ? 'Edit saved view' : 'Save report view'}
      description="Save filters and columns. Shared views always run under the viewer’s current permissions."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <label className="block text-xs">
          Report name
          <input
            className={`${reportInput} mt-2 w-full`}
            required
            minLength={2}
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="block text-xs">
          Visibility
          <select
            className={`${reportInput} mt-2 w-full`}
            value={visibility}
            onChange={(event) => setVisibility(event.target.value)}
          >
            {[
              'PRIVATE',
              'TEAM',
              'DEPARTMENT',
              ...(permitted(permissions, 'reports.manage_access')
                ? ['GLOBAL']
                : []),
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        {mutation.isError && (
          <p role="alert">
            {mutation.error.response?.data?.error?.message ||
              'Unable to save view'}
          </p>
        )}
        <button className={reportButton} disabled={mutation.isPending}>
          Save view
        </button>
      </form>
    </HRMSDialog>
  );
}
export function ReportScheduleDialog({ report, filters, onClose, existing }) {
  const accountEmail = useAuthStore((state) => state.user?.email);
  const email = existing?.recipients?.[0] || accountEmail;
  const [name, setName] = useState(existing?.name || report.title),
    [frequency, setFrequency] = useState(existing?.frequency || 'DAILY'),
    [format, setFormat] = useState(existing?.format || 'csv');
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      api[existing ? 'patch' : 'post'](
        existing ? `/reports/scheduled/${existing._id}` : '/reports/scheduled',
        {
          name,
          reportKey: report.key,
          filters,
          format,
          frequency,
          recipients: [email],
          status: 'ACTIVE',
        },
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['scheduledReports'] });
      client.invalidateQueries({ queryKey: ['reports'] });
      onClose('Scheduled report saved.');
    },
  });
  return (
    <HRMSDialog
      open
      onOpenChange={() => onClose()}
      title="Schedule report"
      description="Delivered at 09:00 IST to your own account email. Daily/weekly/monthly reports cover the previous completed day/7 days/month; date filters roll automatically."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <label className="block text-xs">
          Schedule name
          <input
            className={`${reportInput} mt-2 w-full`}
            required
            minLength={2}
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="block text-xs">
          Frequency
          <select
            className={`${reportInput} mt-2 w-full`}
            value={frequency}
            onChange={(event) => setFrequency(event.target.value)}
          >
            {['DAILY', 'WEEKLY', 'MONTHLY'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          Format
          <select
            className={`${reportInput} mt-2 w-full`}
            value={format}
            onChange={(event) => setFormat(event.target.value)}
          >
            {['csv', 'xlsx', 'pdf'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <p className="text-xs">
          Recipient: {email || 'Account email unavailable; sign in again'}
        </p>
        {mutation.isError && (
          <p role="alert">
            {mutation.error.response?.data?.error?.message ||
              'Unable to schedule report'}
          </p>
        )}
        <button
          className={reportButton}
          disabled={mutation.isPending || !email}
        >
          Save schedule
        </button>
      </form>
    </HRMSDialog>
  );
}
export function ReportAccessDialog({ onClose }) {
  const [selected, setSelected] = useState(null),
    [grants, setGrants] = useState([]),
    [notice, setNotice] = useState('');
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['reportAccess'],
    queryFn: async () => (await api.get('/reports/access')).data.data,
  });
  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/reports/access/${selected}`, { permissions: grants }),
    onSuccess: () => {
      setNotice(
        'Report permissions updated. Users receive the changes on their next authenticated request.',
      );
      client.invalidateQueries({ queryKey: ['reportAccess'] });
      client.invalidateQueries({ queryKey: ['reports'] });
    },
  });
  return (
    <HRMSDialog
      wide
      open
      onOpenChange={() => onClose()}
      title="Report access settings"
      description="Reporting permissions only. Category permissions select reports; own/team/department/assigned/all grants determine server query scope. Finance and payroll require separate grants. Super Admin always has full access."
    >
      {query.isPending && <p role="status">Loading permissions…</p>}
      {query.isError && <p role="alert">Unable to load access settings.</p>}
      {query.data && (
        <div className="space-y-4">
          <label className="text-xs">
            Role
            <select
              className={`${reportInput} ml-3`}
              value={selected || ''}
              onChange={(event) => {
                const role = query.data.items.find(
                  (item) => item.name === event.target.value,
                );
                setSelected(role?.name);
                setGrants(role?.permissions || []);
                setNotice('');
              }}
            >
              <option value="">Select role</option>
              {query.data.items
                .filter((item) => item.name !== 'super_admin')
                .map((role) => (
                  <option value={role.name} key={role.name}>
                    {role.label}
                  </option>
                ))}
            </select>
          </label>
          {selected && (
            <>
              <div className="grid max-h-96 gap-3 overflow-y-auto rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
                {query.data.permissions.map((permission) => (
                  <label
                    className="flex items-start gap-2 text-xs"
                    key={permission}
                  >
                    <input
                      type="checkbox"
                      checked={grants.includes(permission)}
                      onChange={(event) =>
                        setGrants(
                          event.target.checked
                            ? [...grants, permission]
                            : grants.filter((item) => item !== permission),
                        )
                      }
                    />
                    {titleCase(permission.replaceAll('.', ' · '))}
                  </label>
                ))}
              </div>
              <button
                className={reportButton}
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                Save report access
              </button>
            </>
          )}
          {notice && (
            <p role="status" className="text-sm">
              {notice}
            </p>
          )}
          {mutation.isError && (
            <p role="alert">
              {mutation.error.response?.data?.error?.message ||
                'Unable to update access'}
            </p>
          )}
        </div>
      )}
    </HRMSDialog>
  );
}
