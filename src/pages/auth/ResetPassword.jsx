import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { queryClient } from '../../lib/queryClient.js';
export default function ResetPassword() {
  const location = useLocation(), navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get('token') || new URLSearchParams(location.search).get('token') || '');
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [done, setDone] = useState(false);
  useEffect(() => { if (location.hash || location.search) navigate('/reset-password', { replace: true }); }, [location.hash, location.search, navigate]);
  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const values = new FormData(event.currentTarget), password = values.get('password');
    if (password !== values.get('confirmation')) { setError('Passwords do not match'); return; }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,128}$/.test(password)) { setError('Use 12–128 characters including uppercase, lowercase and a number'); return; }
    setPending(true); setError('');
    try { await api.post('/auth/reset-password', { token, password }); useAuthStore.getState().clearAuth(); queryClient.clear(); setDone(true); }
    catch (failure) { setError(failure.response?.data?.error?.message || 'Unable to set password. Please retry.'); }
    finally { setPending(false); }
  }
  const valid = /^[a-f0-9]{64}$/.test(token);
  const input = 'mt-2 w-full rounded-xl border border-[#dce7f0] px-3 py-3';
  return <main className="grid min-h-screen place-items-center bg-[#f3f8fd] p-5 text-[#173958]"><section className="w-full max-w-md rounded-3xl border border-[#e5edf6] bg-white p-8 shadow-xl"><p className="font-bold text-[#087dda]">AdBorn ERP</p><h1 className="mt-4 text-2xl font-bold">Set your password</h1>{done ? <p role="status" className="my-5">Password saved successfully. Sign in with your new password.</p> : !valid ? <p role="alert" className="my-5">This link is invalid. Use Forgot password on the login page to request another.</p> : <form onSubmit={submit} className="my-5 space-y-4"><p className="text-xs text-[#71859a]">Use 12–128 characters with uppercase, lowercase and a number.</p><label className="block text-sm">New password<input required minLength={12} maxLength={128} autoComplete="new-password" type="password" name="password" className={input} /></label><label className="block text-sm">Confirm password<input required minLength={12} maxLength={128} autoComplete="new-password" type="password" name="confirmation" className={input} /></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<button disabled={pending} className="w-full rounded-xl bg-[#087dda] px-4 py-3 font-semibold text-white disabled:opacity-50">{pending ? 'Saving…' : 'Save password'}</button></form>}<Link className="text-sm font-semibold text-[#087dda]" to="/login">Back to login</Link></section></main>;
}
