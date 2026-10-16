import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Download, FileClock, Trash2, Upload, XCircle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../services/api.js';
import HRMSPageHeader from '../../components/hrms/HRMSPageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAuthStore } from '../../store/authStore.js';

const documentTypes = ['identity_proof', 'address_proof', 'profile_photo', 'education', 'bank_proof', 'experience', 'offer_letter', 'other'];
const requiredTypes = new Set(['identity_proof', 'address_proof', 'profile_photo', 'education', 'bank_proof']);
const inputClass = 'min-h-11 w-full rounded-xl border border-[#dce7f0] bg-white px-3 text-xs text-[#173958] outline-none focus:border-[#0987C4] focus:ring-4 focus:ring-[#0987c414]';
const pretty = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function EmployeeOnboarding() {
  const { openHRMSNavigation } = useOutletContext();
  const user = useAuthStore((state) => state.user);
  const [documentType, setDocumentType] = useState('identity_proof');
  const [file, setFile] = useState(null);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['my-onboarding'], queryFn: async ({ signal }) => (await api.get('/hrms/self/onboarding', { signal })).data.data });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['my-onboarding'] });
  const uploadMutation = useMutation({
    mutationFn: async () => {
      const body = new FormData();
      body.append('type', documentType);
      body.append('file', file);
      return (await api.post('/hrms/self/onboarding/documents', body)).data;
    },
    onSuccess: async () => { setFile(null); await refresh(); },
  });
  const deleteMutation = useMutation({ mutationFn: async (documentId) => (await api.delete(`/hrms/self/onboarding/documents/${documentId}`)).data, onSuccess: refresh });
  const download = async (document) => {
    const response = await api.get(`/hrms/self/onboarding/documents/${document._id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = window.document.createElement('a');
    link.href = url; link.download = document.originalName; link.click(); URL.revokeObjectURL(url);
  };
  const data = query.data;
  const documents = data?.documents || [];
  const latest = new Map();
  for (const document of documents) if (!latest.has(document.type)) latest.set(document.type, document);
  const error = uploadMutation.error || deleteMutation.error;

  return <div>
    <HRMSPageHeader title="My Onboarding" description="Upload your required documents. HR will review and verify each submission." onOpenNavigation={openHRMSNavigation} />
    {query.isPending ? <div className="h-64 animate-pulse rounded-[18px] bg-white" /> : query.isError ? <div role="alert" className="rounded-2xl bg-[#fff1f2] p-5 text-xs text-[#b53e49]">{query.error.response?.status === 404 ? 'Your onboarding form has not been assigned yet.' : 'Unable to load your onboarding documents.'}</div> : <div className="space-y-4">
      <section className="grid gap-3 rounded-[18px] border border-[#edf2f7] bg-white p-4 shadow-[0_7px_24px_#376fbb08] sm:grid-cols-3"><div><span className="text-[9px] text-[#7c8ea2]">Employee</span><strong className="block text-xs text-[#0f3150]">{data.onboarding.title}</strong></div><div><span className="text-[9px] text-[#7c8ea2]">Status</span><strong className="block text-xs text-[#0f3150]">{data.onboarding.status}</strong></div><div><span className="text-[9px] text-[#7c8ea2]">Progress</span><strong className="block text-xs text-[#0f3150]">{data.onboarding.data?.progress || 0}%</strong></div></section>
      <section className="rounded-[18px] border border-[#edf2f7] bg-white p-4 shadow-[0_7px_24px_#376fbb08]"><h2 className="mb-3 text-sm font-bold text-[#0e3152]">Required documents</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[...requiredTypes].map((type) => { const document = latest.get(type); return <article key={type} className="flex items-center gap-3 rounded-xl border border-[#e4ebf2] p-3"><span className={`grid size-9 shrink-0 place-items-center rounded-lg ${document?.status === 'Verified' ? 'bg-[#e5f8ee] text-[#07885b]' : document?.status === 'Rejected' ? 'bg-[#fff0f1] text-[#cc4650]' : 'bg-[#edf6fc] text-[#006EB5]'}`}>{document?.status === 'Verified' ? <CheckCircle2 size={17} /> : document?.status === 'Rejected' ? <XCircle size={17} /> : <FileClock size={17} />}</span><div className="min-w-0 flex-1"><strong className="block text-[10px] text-[#173653]">{pretty(type)}</strong><span className="block truncate text-[9px] text-[#7a8da3]">{document ? `${document.originalName} · ${document.status}` : 'Not uploaded'}</span></div>{document && <button type="button" aria-label={`Download ${pretty(type)}`} className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#006EB5] hover:bg-[#edf6fc]" onClick={() => download(document)}><Download size={15} /></button>}</article>; })}</div></section>
      {data.onboarding.status !== 'Completed' && <section className="rounded-[18px] border border-[#dceaf4] bg-[#f7fbfe] p-4"><h2 className="text-sm font-bold text-[#0e3152]">Upload document</h2><p className="mt-1 text-[10px] text-[#71849a]">PDF, JPG or PNG up to 10 MB. New uploads wait for HR verification.</p><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]"><select aria-label="Document type" className={inputClass} value={documentType} onChange={(event) => setDocumentType(event.target.value)}>{documentTypes.map((type) => <option key={type} value={type}>{pretty(type)}{requiredTypes.has(type) ? ' *' : ''}</option>)}</select><input aria-label="Choose my onboarding document" className={`${inputClass} py-2`} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setFile(event.target.files?.[0] || null)} /><Button type="button" disabled={!file || uploadMutation.isPending} onClick={() => uploadMutation.mutate()}><Upload size={15} /> {uploadMutation.isPending ? 'Uploading…' : 'Upload'}</Button></div></section>}
      <section className="rounded-[18px] border border-[#edf2f7] bg-white p-4"><h2 className="mb-3 text-sm font-bold text-[#0e3152]">My uploads</h2><div className="space-y-2">{documents.map((document) => <div key={document._id} className="flex items-center gap-3 rounded-xl border border-[#e8eef4] p-3"><div className="min-w-0 flex-1"><strong className="block truncate text-[10px] text-[#173653]">{document.originalName}</strong><span className="text-[9px] text-[#7b8ca0]">{pretty(document.type)} · {document.status}{document.note ? ` · ${document.note}` : ''}</span></div><button type="button" aria-label={`Download ${document.originalName}`} className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#006EB5] hover:bg-[#edf6fc]" onClick={() => download(document)}><Download size={15} /></button>{String(document.uploadedBy) === String(user.id) && document.status !== 'Verified' && <button type="button" aria-label={`Remove ${document.originalName}`} className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#c14851] hover:bg-[#fff0f1]" onClick={() => deleteMutation.mutate(document._id)}><Trash2 size={15} /></button>}</div>)}{!documents.length && <p className="py-5 text-center text-[10px] text-[#7b8ca0]">No documents uploaded yet.</p>}</div></section>
      {error && <p role="alert" className="rounded-xl bg-[#fff1f2] p-3 text-xs text-[#b53e49]">{error.response?.data?.error?.message || error.message}</p>}
    </div>}
  </div>;
}
