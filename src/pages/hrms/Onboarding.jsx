import { useDepartmentOptions } from '../../services/departmentService.js';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Download,
  FileCheck2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../services/api.js';
import HRMSPageHeader from '../../components/hrms/HRMSPageHeader.jsx';
import HRMSDialog from '../../components/hrms/HRMSDialog.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAuthStore } from '../../store/authStore.js';
import EmployeeOnboarding from './EmployeeOnboarding.jsx';

const documentTypes = [
  'identity_proof',
  'address_proof',
  'profile_photo',
  'education',
  'bank_proof',
  'experience',
  'offer_letter',
  'other',
];
const requiredTypes = new Set([
  'identity_proof',
  'address_proof',
  'profile_photo',
  'education',
  'bank_proof',
]);
const initialForm = {
  fullName: '',
  email: '',
  dateOfBirth: '',
  phone: '',
  alternatePhone: '',
  gender: '',
  bloodGroup: '',
  maritalStatus: '',
  department: '',
  designation: '',
  employmentType: 'full_time',
  joiningDate: '',
  manager: '',
  workLocation: '',
  currentAddress: '',
  permanentAddress: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelationship: '',
  qualification: '',
  institute: '',
  educationYear: '',
  previousCompany: '',
  previousDesignation: '',
  experienceYears: '',
};
const inputClass =
  'mt-1.5 min-h-11 w-full rounded-xl border border-[#dce7f0] bg-white px-3 text-xs text-[#173958] outline-none focus:border-[#0987C4] focus:ring-4 focus:ring-[#0987c414]';
const pretty = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const shortDate = (value) =>
  value
    ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(
        new Date(value),
      )
    : '—';

function formFromRecord(record) {
  const data = record.data || {};
  const personal = data.personal || {};
  const employment = data.employment || {};
  const address = data.address || {};
  const emergency = data.emergencyContact || {};
  const education = data.education?.[0] || {};
  const experience = data.experience?.[0] || {};
  const dateInput = (value) =>
    value ? new Date(value).toISOString().slice(0, 10) : '';
  return {
    fullName: personal.fullName || '',
    email: personal.email || '',
    dateOfBirth: dateInput(personal.dateOfBirth),
    phone: personal.phone || '',
    alternatePhone: personal.alternatePhone || '',
    gender: personal.gender || '',
    bloodGroup: personal.bloodGroup || '',
    maritalStatus: personal.maritalStatus || '',
    department: employment.department || record.department || '',
    designation: employment.designation || '',
    employmentType: employment.employmentType || 'full_time',
    joiningDate: dateInput(employment.joiningDate || record.effectiveDate),
    manager: employment.manager || '',
    workLocation: employment.workLocation || '',
    currentAddress: address.current || '',
    permanentAddress: address.permanent || '',
    emergencyName: emergency.name || '',
    emergencyPhone: emergency.phone || '',
    emergencyRelationship: emergency.relationship || '',
    qualification: education.qualification || '',
    institute: education.institute || '',
    educationYear: education.year || '',
    previousCompany: experience.company || '',
    previousDesignation: experience.designation || '',
    experienceYears: experience.years ?? '',
  };
}

function onboardingPayload(form) {
  return {
    personal: {
      fullName: form.fullName,
      email: form.email,
      dateOfBirth: form.dateOfBirth,
      phone: form.phone,
      alternatePhone: form.alternatePhone || undefined,
      gender: form.gender || undefined,
      bloodGroup: form.bloodGroup || undefined,
      maritalStatus: form.maritalStatus || undefined,
    },
    employment: {
      department: form.department,
      designation: form.designation,
      employmentType: form.employmentType,
      joiningDate: form.joiningDate,
      manager: form.manager || undefined,
      workLocation: form.workLocation,
    },
    address: { current: form.currentAddress, permanent: form.permanentAddress },
    emergencyContact: {
      name: form.emergencyName,
      phone: form.emergencyPhone,
      relationship: form.emergencyRelationship,
    },
    education: form.qualification
      ? [
          {
            qualification: form.qualification,
            institute: form.institute,
            year: Number(form.educationYear),
          },
        ]
      : [],
    experience: form.previousCompany
      ? [
          {
            company: form.previousCompany,
            designation: form.previousDesignation,
            years: Number(form.experienceYears),
          },
        ]
      : [],
  };
}

function Field({ label, className = '', children }) {
  return (
    <label className={`text-[11px] font-semibold text-[#31516f] ${className}`}>
      {label}
      {children}
    </label>
  );
}

function OnboardingForm({ open, onOpenChange, record = null }) {
  const departmentOptions = useDepartmentOptions(open);
  const departments = (departmentOptions.data || []).filter(
    (item) => item.status === 'ACTIVE',
  );
  const [form, setForm] = useState(() =>
    record ? formFromRecord(record) : initialForm,
  );
  const queryClient = useQueryClient();
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const mutation = useMutation({
    mutationFn: async () =>
      (
        await (record
          ? api.patch(`/hrms/onboarding/${record._id}`, onboardingPayload(form))
          : api.post('/hrms/onboarding', onboardingPayload(form)))
      ).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['hrms-onboarding'] });
      setForm(initialForm);
      onOpenChange(false);
    },
  });
  const error =
    mutation.error?.response?.data?.error?.message || mutation.error?.message || departmentOptions.error?.message;
  return (
    <HRMSDialog
      open={open}
      onOpenChange={onOpenChange}
      title={record ? 'Edit employee onboarding' : 'Start employee onboarding'}
      description="After this form is created, the employee ID and password can be created immediately. Documents can be completed later."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
        className="space-y-5"
      >
        <section>
          <h3 className="mb-3 text-xs font-bold text-[#0e3152]">
            Personal details
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <input
                className={inputClass}
                required
                value={form.fullName}
                onChange={update('fullName')}
                autoFocus
              />
            </Field>
            <Field label="Personal email">
              <input
                className={inputClass}
                required
                type="email"
                value={form.email}
                onChange={update('email')}
              />
            </Field>
            <Field label="Date of birth">
              <input
                className={inputClass}
                required
                type="date"
                value={form.dateOfBirth}
                onChange={update('dateOfBirth')}
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputClass}
                required
                value={form.phone}
                onChange={update('phone')}
              />
            </Field>
            <Field label="Alternate phone">
              <input
                className={inputClass}
                value={form.alternatePhone}
                onChange={update('alternatePhone')}
              />
            </Field>
            <Field label="Gender">
              <select
                className={inputClass}
                value={form.gender}
                onChange={update('gender')}
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
              </select>
            </Field>
            <Field label="Blood group">
              <select
                className={inputClass}
                value={form.bloodGroup}
                onChange={update('bloodGroup')}
              >
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(
                  (item) => (
                    <option key={item}>{item}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Marital status">
              <select
                className={inputClass}
                value={form.maritalStatus}
                onChange={update('maritalStatus')}
              >
                <option value="">Select</option>
                <option>Single</option>
                <option>Married</option>
                <option>Other</option>
              </select>
            </Field>
          </div>
        </section>
        <section>
          <h3 className="mb-3 text-xs font-bold text-[#0e3152]">
            Employment details
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Department">
              <select
                className={inputClass}
                required
                value={form.department}
                onChange={update('department')}
              >
                <option value="">Select department</option>
              {form.department && !departments.some((row) => row.id === form.department) && <option value={form.department}>{form.department} (current)</option>}
                {departments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Designation">
              <input
                className={inputClass}
                required
                value={form.designation}
                onChange={update('designation')}
              />
            </Field>
            <Field label="Employment type">
              <select
                className={inputClass}
                value={form.employmentType}
                onChange={update('employmentType')}
              >
                <option value="full_time">Full time</option>
                <option value="part_time">Part time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </Field>
            <Field label="Joining date">
              <input
                className={inputClass}
                required
                type="date"
                value={form.joiningDate}
                onChange={update('joiningDate')}
              />
            </Field>
            <Field label="Work location">
              <input
                className={inputClass}
                required
                value={form.workLocation}
                onChange={update('workLocation')}
              />
            </Field>
            <Field label="Manager ID (optional)">
              <input
                className={inputClass}
                pattern="[a-fA-F0-9]{24}"
                value={form.manager}
                onChange={update('manager')}
                placeholder="Existing manager ID"
              />
            </Field>
          </div>
        </section>
        <section>
          <h3 className="mb-3 text-xs font-bold text-[#0e3152]">
            Address and emergency contact
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Current address" className="sm:col-span-2">
              <textarea
                className={`${inputClass} py-3`}
                required
                rows="2"
                value={form.currentAddress}
                onChange={update('currentAddress')}
              />
            </Field>
            <Field label="Permanent address" className="sm:col-span-2">
              <textarea
                className={`${inputClass} py-3`}
                required
                rows="2"
                value={form.permanentAddress}
                onChange={update('permanentAddress')}
              />
            </Field>
            <Field label="Emergency contact name">
              <input
                className={inputClass}
                required
                value={form.emergencyName}
                onChange={update('emergencyName')}
              />
            </Field>
            <Field label="Emergency phone">
              <input
                className={inputClass}
                required
                value={form.emergencyPhone}
                onChange={update('emergencyPhone')}
              />
            </Field>
            <Field label="Relationship">
              <input
                className={inputClass}
                required
                value={form.emergencyRelationship}
                onChange={update('emergencyRelationship')}
              />
            </Field>
          </div>
        </section>
        <section>
          <h3 className="mb-3 text-xs font-bold text-[#0e3152]">
            Education and experience
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Highest qualification">
              <input
                className={inputClass}
                required
                value={form.qualification}
                onChange={update('qualification')}
              />
            </Field>
            <Field label="Institute">
              <input
                className={inputClass}
                required
                value={form.institute}
                onChange={update('institute')}
              />
            </Field>
            <Field label="Passing year">
              <input
                className={inputClass}
                required
                type="number"
                min="1950"
                max="2200"
                value={form.educationYear}
                onChange={update('educationYear')}
              />
            </Field>
            <Field label="Previous company (optional)">
              <input
                className={inputClass}
                value={form.previousCompany}
                onChange={update('previousCompany')}
              />
            </Field>
            {form.previousCompany && (
              <>
                <Field label="Previous designation">
                  <input
                    className={inputClass}
                    required
                    value={form.previousDesignation}
                    onChange={update('previousDesignation')}
                  />
                </Field>
                <Field label="Experience years">
                  <input
                    className={inputClass}
                    required
                    type="number"
                    min="0"
                    max="60"
                    step="0.5"
                    value={form.experienceYears}
                    onChange={update('experienceYears')}
                  />
                </Field>
              </>
            )}
          </div>
        </section>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-[#edf2f6] pt-4">
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
              : record
                ? 'Save onboarding'
                : 'Create unassigned onboarding'}
          </Button>
        </div>
      </form>
    </HRMSDialog>
  );
}

function OnboardingDetails({ id, onClose }) {
  const [documentType, setDocumentType] = useState('identity_proof');
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['hrms-onboarding', id],
    queryFn: async () => (await api.get(`/hrms/onboarding/${id}`)).data.data,
    enabled: Boolean(id),
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['hrms-onboarding', id] }),
      queryClient.invalidateQueries({ queryKey: ['hrms-onboarding'] }),
      queryClient.invalidateQueries({ queryKey: ['hrms-dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['hrms-employees'] }),
    ]);
  };
  const uploadMutation = useMutation({
    mutationFn: async () => {
      const body = new FormData();
      body.append('type', documentType);
      body.append('file', file);
      return (await api.post(`/hrms/onboarding/${id}/documents`, body)).data;
    },
    onSuccess: async () => {
      setFile(null);
      await refresh();
    },
  });
  const verifyMutation = useMutation({
    mutationFn: async ({ documentId, status }) =>
      (
        await api.patch(
          `/hrms/onboarding/${id}/documents/${documentId}/verify`,
          { status },
        )
      ).data,
    onSuccess: refresh,
  });
  const completeMutation = useMutation({
    mutationFn: async () =>
      (await api.post(`/hrms/onboarding/${id}/complete`, {})).data,
    onSuccess: refresh,
  });
  const data = query.data;
  const documents = data?.documents || [];
  const latest = new Map();
  for (const document of documents)
    if (!latest.has(document.type)) latest.set(document.type, document);
  const requiredReady = [...requiredTypes].every(
    (type) => latest.get(type)?.status === 'Verified',
  );
  const error =
    uploadMutation.error || verifyMutation.error || completeMutation.error;
  const download = async (document) => {
    const response = await api.get(
      `/hrms/onboarding/${id}/documents/${document._id}/download`,
      { responseType: 'blob' },
    );
    const url = URL.createObjectURL(response.data);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.originalName;
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <HRMSDialog
      open={Boolean(id)}
      onOpenChange={(open) => !open && onClose()}
      title={data?.onboarding?.title || 'Onboarding details'}
      description="Employee or HR can upload documents. HR verifies them and completes onboarding."
    >
      {query.isPending ? (
        <div className="h-52 animate-pulse rounded-2xl bg-[#f1f5f9]" />
      ) : query.isError ? (
        <p
          role="alert"
          className="rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]"
        >
          Unable to load onboarding details.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 rounded-2xl bg-[#f5f9fc] p-4 sm:grid-cols-3">
            <div>
              <span className="text-[9px] text-[#7c8ea2]">Status</span>
              <strong className="block text-xs text-[#0f3150]">
                {data.onboarding.status}
              </strong>
            </div>
            <div>
              <span className="text-[9px] text-[#7c8ea2]">Department</span>
              <strong className="block text-xs text-[#0f3150]">
                {pretty(data.onboarding.department)}
              </strong>
            </div>
            <div>
              <span className="text-[9px] text-[#7c8ea2]">Progress</span>
              <strong className="block text-xs text-[#0f3150]">
                {data.onboarding.data.progress || 0}%
              </strong>
            </div>
          </div>
          <section>
            <h3 className="mb-3 text-xs font-bold text-[#0e3152]">
              Required documents
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {[...requiredTypes].map((type) => {
                const document = latest.get(type);
                return (
                  <article
                    key={type}
                    className="flex items-center gap-2 rounded-xl border border-[#e4ebf2] p-3"
                  >
                    <span
                      className={`grid size-8 place-items-center rounded-lg ${document?.status === 'Verified' ? 'bg-[#e5f8ee] text-[#07885b]' : document?.status === 'Rejected' ? 'bg-[#fff0f1] text-[#cc4650]' : 'bg-[#edf6fc] text-[#006EB5]'}`}
                    >
                      {document?.status === 'Verified' ? (
                        <CheckCircle2 size={16} />
                      ) : document?.status === 'Rejected' ? (
                        <XCircle size={16} />
                      ) : (
                        <FileCheck2 size={16} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="block text-[10px] text-[#173653]">
                        {pretty(type)}
                      </strong>
                      <span className="block truncate text-[9px] text-[#7a8da3]">
                        {document
                          ? `${document.originalName} · ${document.status}`
                          : 'Not uploaded'}
                      </span>
                    </div>
                    {document && (
                      <button
                        type="button"
                        aria-label={`Download ${pretty(type)}`}
                        className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#006EB5] hover:bg-[#edf6fc]"
                        onClick={() => download(document)}
                      >
                        <Download size={15} />
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
          {data.onboarding.status !== 'Completed' && (
            <>
              <section className="rounded-2xl border border-[#dceaf4] bg-[#f7fbfe] p-4">
                <h3 className="mb-3 text-xs font-bold text-[#0e3152]">
                  Upload document
                </h3>
                <div className="grid gap-3 sm:grid-cols-[1fr_1.3fr_auto]">
                  <select
                    className={inputClass}
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                  >
                    {documentTypes.map((type) => (
                      <option key={type} value={type}>
                        {pretty(type)}
                        {requiredTypes.has(type) ? ' *' : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="Choose onboarding document"
                    className={`${inputClass} py-2`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(event) =>
                      setFile(event.target.files?.[0] || null)
                    }
                  />
                  <Button
                    type="button"
                    disabled={!file || uploadMutation.isPending}
                    onClick={() => uploadMutation.mutate()}
                  >
                    <Upload size={15} /> Upload
                  </Button>
                </div>
              </section>
              <section>
                <h3 className="mb-3 text-xs font-bold text-[#0e3152]">
                  Document review
                </h3>
                <div className="space-y-2">
                  {documents.map((document) => (
                    <div
                      key={document._id}
                      className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e8eef4] p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <strong className="block truncate text-[10px]">
                          {document.originalName}
                        </strong>
                        <span className="text-[9px] text-[#7b8ca0]">
                          {pretty(document.type)} · {document.status}
                        </span>
                      </div>
                      {document.status !== 'Verified' && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            verifyMutation.mutate({
                              documentId: document._id,
                              status: 'Verified',
                            })
                          }
                        >
                          Verify
                        </Button>
                      )}
                      {document.status !== 'Rejected' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            verifyMutation.mutate({
                              documentId: document._id,
                              status: 'Rejected',
                            })
                          }
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  ))}
                  {!documents.length && (
                    <p className="text-[10px] text-[#7b8ca0]">
                      No documents uploaded.
                    </p>
                  )}
                </div>
              </section>
              <section className="rounded-2xl border border-[#dbeaf4] p-4">
                <h3 className="text-xs font-bold text-[#0e3152]">
                  Complete onboarding
                </h3>
                <p className="mt-1 text-[10px] leading-4 text-[#71849a]">
                  Complete onboarding after every required document is verified.
                  Employee login can be created before this reaches 100%.
                </p>
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    disabled={!requiredReady || completeMutation.isPending}
                    onClick={() => completeMutation.mutate()}
                  >
                    <CheckCircle2 size={16} />{' '}
                    {completeMutation.isPending
                      ? 'Completing…'
                      : 'Complete onboarding'}
                  </Button>
                </div>
                {!requiredReady && (
                  <p className="mt-2 text-[9px] font-medium text-[#b9780a]">
                    Verify all required documents to enable completion.
                  </p>
                )}
              </section>
            </>
          )}
          {data.onboarding.employee &&
            data.onboarding.status !== 'Completed' && (
              <section className="rounded-2xl border border-[#cde1f1] bg-[#f3f9fd] p-4">
                <h3 className="text-xs font-bold text-[#18577f]">
                  Employee login is active
                </h3>
                <p className="mt-1 text-[10px] leading-4 text-[#57768d]">
                  The employee can now sign in and upload their own documents.
                  HR can also upload and verify them here.
                </p>
              </section>
            )}
          {data.onboarding.status === 'Completed' && (
            <section className="rounded-2xl border border-[#bfe4d2] bg-[#f0fbf6] p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#dff6ea] text-[#07885b]">
                  <CheckCircle2 size={18} />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-[#155c43]">
                    Onboarding completed
                  </h3>
                  <p className="mt-1 text-[10px] leading-4 text-[#517d6c]">
                    All required documents have been verified.
                  </p>
                </div>
              </div>
            </section>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]"
            >
              {error.response?.data?.error?.message || error.message}
            </p>
          )}
        </div>
      )}
    </HRMSDialog>
  );
}

function HRMSOnboarding() {
  const { openHRMSNavigation } = useOutletContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['hrms-onboarding'],
    queryFn: async ({ signal }) =>
      (await api.get('/hrms/onboarding', { signal })).data,
    staleTime: 30000,
  });
  const rows = (query.data?.data?.items || []).filter((item) =>
    `${item.title} ${item.data?.personal?.email || ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const deleteMutation = useMutation({
    mutationFn: async (record) =>
      (await api.delete(`/hrms/onboarding/${record._id}`)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['hrms-onboarding'] });
      setDeleteRecord(null);
    },
  });
  return (
    <div>
      <HRMSPageHeader
        title="Employee Onboarding"
        description="Create the onboarding form, issue employee login immediately, then collect and verify documents."
        onOpenNavigation={openHRMSNavigation}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Start onboarding
          </Button>
        }
      />
      <section className="rounded-[18px] border border-[#edf2f7] bg-white p-4 shadow-[0_7px_24px_#376fbb08]">
        <div className="mb-4 flex items-center gap-3">
          <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[#dfe8f2] px-3 text-[#7890a7] sm:max-w-md">
            <Search size={16} />
            <input
              aria-label="Search onboarding"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email"
              className="w-full bg-transparent text-xs outline-none"
            />
          </label>
          <span className="rounded-full bg-[#fff4df] px-3 py-1.5 text-[9px] font-semibold text-[#a96900]">
            ID and password from Employees
          </span>
        </div>
        {query.isPending ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
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
            Unable to load onboarding cases.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[820px] text-left">
              <thead>
                <tr>
                  {[
                    'Person',
                    'Department',
                    'Joining date',
                    'Progress',
                    'Status',
                    'Actions',
                  ].map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong className="block text-[10px] text-[#183553]">
                        {item.title}
                      </strong>
                      <span className="text-[9px]">
                        {item.data?.personal?.email}
                      </span>
                    </td>
                    <td>{pretty(item.department)}</td>
                    <td>{shortDate(item.data?.employment?.joiningDate)}</td>
                    <td>
                      <div className="w-28">
                        <div className="mb-1 flex justify-between">
                          <span>{item.data?.progress || 0}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#eaf0f5]">
                          <div
                            className="h-full rounded-full bg-[#0987C4]"
                            style={{ width: `${item.data?.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`rounded-lg px-2.5 py-1.5 text-[9px] font-semibold ${item.status === 'Unassigned' ? 'bg-[#fff4df] text-[#a96900]' : 'bg-[#e5f8ee] text-[#07885b]'}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedId(item._id)}
                        >
                          {item.status === 'Unassigned' ? 'Continue' : 'View'}
                        </Button>
                        {item.status !== 'Completed' && (
                          <button
                            type="button"
                            aria-label={`Edit ${item.title}`}
                            className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#006EB5] hover:bg-[#eaf5fc]"
                            onClick={() => setEditRecord(item)}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {!item.employee && item.status === 'Unassigned' && (
                          <button
                            type="button"
                            aria-label={`Delete ${item.title}`}
                            className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#c14851] hover:bg-[#fff0f1]"
                            onClick={() => setDeleteRecord(item)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <div className="py-12 text-center text-xs text-[#73869b]">
                No onboarding cases found.
              </div>
            )}
          </div>
        )}
      </section>
      {createOpen && <OnboardingForm open onOpenChange={setCreateOpen} />}
      <OnboardingForm
        key={editRecord?._id || 'onboarding-editor'}
        record={editRecord}
        open={Boolean(editRecord)}
        onOpenChange={(open) => !open && setEditRecord(null)}
      />
      {selectedId && (
        <OnboardingDetails
          id={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
      <HRMSDialog
        open={Boolean(deleteRecord)}
        onOpenChange={(open) => !open && setDeleteRecord(null)}
        title="Delete onboarding form"
        description="Only unassigned forms without an employee account can be deleted."
      >
        <p className="rounded-xl bg-[#fff5f5] p-4 text-xs text-[#8e3d44]">
          Delete <strong>{deleteRecord?.title}</strong>?
        </p>
        {deleteMutation.isError && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]"
          >
            {deleteMutation.error.response?.data?.error?.message ||
              'Unable to delete onboarding form.'}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteRecord(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteMutation.mutate(deleteRecord)}
            disabled={deleteMutation.isPending}
            className="bg-gradient-to-br from-[#e05b65] to-[#a72f3a]"
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </HRMSDialog>
    </div>
  );
}

export default function Onboarding() {
  const role = useAuthStore((state) => state.user?.role);
  return ['employee', 'team_leader'].includes(role) ? (
    <EmployeeOnboarding />
  ) : (
    <HRMSOnboarding />
  );
}
