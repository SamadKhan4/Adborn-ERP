import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api.js';
import { importFields } from '../../../shared/crmImport.js';
import HRMSDialog from '../hrms/HRMSDialog.jsx';
import { Button } from '../ui/Button.jsx';
import {
  AssigneeSelect,
  can,
  downloadCSV,
  Field,
  input,
  Message,
  useCRMMutation,
  useMetadata,
  usePermissions,
} from './CRMShared.jsx';
const csv = (value) => { let text = String(value ?? ''); if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; };
export default function LeadImportDialog({ onClose }) {
  const metadata = useMetadata();
  const permissions = usePermissions();
  const client = useQueryClient();
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [defaults, setDefaults] = useState({
    leadSource: 'Website',
    priority: 'MEDIUM',
    temperature: 'WARM',
  });
  const [validation, setValidation] = useState(null);
  const [selected, setSelected] = useState([]);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);
  const upload = useCRMMutation(
    async (file) => {
      const form = new FormData();
      form.append('file', file);
      return (
        await api.post('/crm/leads/import/preview', form, { timeout: 60000 })
      ).data;
    },
    (payload) => {
      setPreview(payload.data);
      setMapping(payload.data.mapping);
      setValidation(null);
      setResults([]);
      setProgress(0);
    },
    [],
  );
  const validate = useCRMMutation(
    async () =>
      (
        await api.post(
          `/crm/leads/import/${preview.batchId}/validate`,
          { mapping, defaults },
          { timeout: 60000 },
        )
      ).data,
    (payload) => {
      setValidation(payload.data);
      setSelected(
        payload.data.rows
          .filter((row) => row.status === 'VALID')
          .map((row) => row.row),
      );
    },
    [],
  );
  const commit = useCRMMutation(
    async () => {
      let accumulated = [...results];
      for (let offset = 0; offset < selected.length; offset += 25) {
        const { data } = await api.post(
          `/crm/leads/import/${preview.batchId}/commit`,
          {
            mapping,
            defaults,
            rows: selected.slice(offset, offset + 25),
            allowCompanyDuplicates: allowDuplicates,
          },
          { timeout: 60000 },
        );
        accumulated = [
          ...accumulated.filter(
            (item) => !data.data.results.some((next) => next.row === item.row),
          ),
          ...data.data.results,
        ];
        setResults(accumulated);
        setProgress(Math.min(selected.length, offset + 25));
      }
      await Promise.all(
        [
          'leads',
          'crmDashboard',
          'pipeline',
          'crmReports',
          'leadActivities',
          'notifications',
        ].map((key) => client.invalidateQueries({ queryKey: [key] })),
      );
      return { message: 'Import finished. Review the row results below.' };
    },
    undefined,
    [],
  );
  const busy = upload.isPending || validate.isPending || commit.isPending;
  const changeConfig = () => {
    setValidation(null);
    setSelected([]);
    setAllowDuplicates(false);
  };
  const template = () =>
    downloadCSV(
      'adborn-leads-template.csv',
      `${importFields.map(([, title]) => csv(title)).join(',')}\r\n`,
    );
  const resultExport = () =>
    downloadCSV(
      'adborn-lead-import-results.csv',
      [
        ['Excel Row', 'Status', 'Lead ID', 'Message'],
        ...results.map((row) => [row.row, row.status, row.leadId, row.message]),
        ...(validation?.rows
          .filter((row) => row.status === 'INVALID')
          .map((row) => [row.row, 'INVALID', '', row.errors.join('; ')]) || []),
      ]
        .map((row) => row.map(csv).join(','))
        .join('\r\n'),
    );
  const duplicateWarnings = validation?.rows.some(
    (row) => selected.includes(row.row) && row.warnings?.length,
  );
  return (
    <HRMSDialog
      wide
      open
      onOpenChange={(open) => !open && !busy && onClose()}
      title="Import Leads from Excel"
      description="Upload an .xlsx workbook, map its columns, review validation, then import selected valid rows."
    >
      <div className="space-y-5">
        <div className="rounded-xl bg-sky-50 p-4 text-xs text-[#31516f]">
          <p>
            Use the first populated visible sheet. Row 1 must contain headers.
            Maximum 500 leads, 50 columns, and 5 MB per upload. Phone numbers
            should be formatted as Text to preserve leading zeros. Use ISO dates
            with a timezone for follow-ups. Separate multiple services/tags with
            commas.
          </p>
          <button
            type="button"
            className="mt-2 font-semibold text-blue-700 underline"
            onClick={template}
          >
            Download column template (CSV, open in Excel and save as .xlsx)
          </button>
        </div>
        <Field label="Excel workbook (.xlsx)">
          <input
            aria-label="Excel workbook"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className={input}
            disabled={busy || results.length > 0}
            onChange={(event) => {
              const file = event.target.files[0];
              if (file) upload.mutate(file);
              event.target.value = '';
            }}
          />
        </Field>
        <Message mutation={upload} />
        {preview && (
          <>
            <p className="text-xs font-semibold">
              {preview.filename} · {preview.sheetName} · {preview.total} lead
              rows
            </p>
            <fieldset disabled={busy || results.length > 0}>
              <legend className="mb-3 text-sm font-bold">
                Map Excel columns
              </legend>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {importFields.map(([key, title]) => (
                  <Field
                    key={key}
                    label={`${title}${key === 'companyName' ? ' (required)' : ''}`}
                  >
                    <select
                      aria-label={`Map ${title}`}
                      className={input}
                      value={mapping[key] ?? ''}
                      onChange={(event) => {
                        const next = { ...mapping };
                        if (event.target.value === '') delete next[key];
                        else next[key] = Number(event.target.value);
                        setMapping(next);
                        changeConfig();
                      }}
                    >
                      <option value="">Ignore / use default</option>
                      {preview.headers.map((header, index) => (
                        <option key={index} value={index}>
                          {index + 1}. {header}
                        </option>
                      ))}
                    </select>
                  </Field>
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Field label="Default source (when blank)">
                  <select
                    className={input}
                    value={defaults.leadSource}
                    onChange={(event) => {
                      setDefaults({
                        ...defaults,
                        leadSource: event.target.value,
                      });
                      changeConfig();
                    }}
                  >
                    {metadata.data?.sources.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </Field>
                {can(permissions, 'crm.leads.assign') && (
                  <Field label="Default owner (otherwise you)">
                    <AssigneeSelect
                      value={defaults.assignedTo}
                      onChange={(value) => {
                        setDefaults({
                          ...defaults,
                          assignedTo: value || undefined,
                        });
                        changeConfig();
                      }}
                    />
                  </Field>
                )}
              </div>
            </fieldset>
            {!validation && (
              <>
                <details>
                  <summary className="cursor-pointer text-xs font-semibold">
                    Raw preview (first 10 rows)
                  </summary>
                  <div className="mt-3 max-h-72 overflow-auto">
                    <table className="min-w-full text-left text-[10px]">
                      <thead>
                        <tr>
                          <th className="p-2">Row</th>
                          {preview.headers.map((header, index) => (
                            <th key={index} className="whitespace-nowrap p-2">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sample.map((row) => (
                          <tr key={row.row}>
                            <td className="p-2">{row.row}</td>
                            {row.cells.map((value, index) => (
                              <td key={index} className="max-w-44 truncate p-2">
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
                <Button
                  disabled={busy || mapping.companyName === undefined}
                  onClick={() => validate.mutate()}
                >
                  Validate rows
                </Button>
              </>
            )}
            <Message mutation={validate} />
            {validation && (
              <>
                <div className="rounded-xl bg-slate-50 p-4 text-xs">
                  Valid: <strong>{validation.valid}</strong> · Invalid:{' '}
                  <strong>{validation.invalid}</strong> · Selected:{' '}
                  <strong>{selected.length}</strong>
                </div>
                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr>
                        <th className="p-2">
                          <input
                            aria-label="Select all valid import rows"
                            type="checkbox"
                            disabled={busy || results.length > 0}
                            checked={
                              validation.valid > 0 &&
                              selected.length === validation.valid
                            }
                            onChange={(event) =>
                              setSelected(
                                event.target.checked
                                  ? validation.rows
                                      .filter((row) => row.status === 'VALID')
                                      .map((row) => row.row)
                                  : [],
                              )
                            }
                          />
                        </th>
                        <th>Excel Row</th>
                        <th>Company</th>
                        <th>Status / issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.rows.map((row) => (
                        <tr key={row.row} className="border-t">
                          <td className="p-2">
                            <input
                              aria-label={`Import Excel row ${row.row}`}
                              type="checkbox"
                              disabled={
                                busy ||
                                results.length > 0 ||
                                row.status !== 'VALID'
                              }
                              checked={selected.includes(row.row)}
                              onChange={(event) =>
                                setSelected(
                                  event.target.checked
                                    ? [...selected, row.row]
                                    : selected.filter(
                                        (value) => value !== row.row,
                                      ),
                                )
                              }
                            />
                          </td>
                          <td>{row.row}</td>
                          <td>{row.companyName}</td>
                          <td
                            className={`p-2 ${row.status === 'INVALID' ? 'text-rose-700' : row.warnings?.length ? 'text-amber-700' : 'text-emerald-700'}`}
                          >
                            {row.status}
                            {[
                              ...(row.errors || []),
                              ...(row.warnings || []),
                            ].map((message) => (
                              <p key={message}>{message}</p>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {duplicateWarnings && (
                  <label className="block rounded-xl bg-amber-50 p-3 text-xs">
                    <input
                      type="checkbox"
                      disabled={busy}
                      checked={allowDuplicates}
                      onChange={(event) =>
                        setAllowDuplicates(event.target.checked)
                      }
                    />{' '}
                    I reviewed the duplicate-company warnings. Import these as
                    separate opportunities. Duplicate phone/email rows remain
                    blocked.
                  </label>
                )}
                <Message mutation={commit} />
                {commit.isPending && (
                  <p role="status" className="text-xs">
                    Importing {progress} of {selected.length} selected leads…
                  </p>
                )}
                <Button
                  disabled={
                    busy ||
                    !selected.length ||
                    (duplicateWarnings && !allowDuplicates) ||
                    commit.isSuccess
                  }
                  onClick={() => commit.mutate()}
                >
                  {commit.isError
                    ? 'Retry remaining import'
                    : 'Import selected valid leads'}
                </Button>
              </>
            )}
            {results.length > 0 && (
              <section className="rounded-xl border p-4">
                <h3 className="text-sm font-bold">
                  Import results ·{' '}
                  {results.filter((row) => row.status === 'IMPORTED').length}{' '}
                  added
                </h3>
                <div className="my-3 max-h-64 overflow-auto space-y-2">
                  {results.map((row) => (
                    <p key={row.row} className="text-xs">
                      Row {row.row}: {row.status} · {row.message}{' '}
                      {row.lead && (
                        <Link
                          className="text-blue-700"
                          to={`/crm/leads/${row.lead}`}
                        >
                          {row.leadId}
                        </Link>
                      )}
                    </p>
                  ))}
                </div>
                <Button size="sm" variant="secondary" onClick={resultExport}>
                  Download row results CSV
                </Button>
              </section>
            )}
          </>
        )}
        <div className="flex justify-end">
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </HRMSDialog>
  );
}
