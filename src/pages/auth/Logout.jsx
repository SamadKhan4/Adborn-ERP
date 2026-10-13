import { tw } from '../../lib/tailwind.js';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService.js';

export default function Logout() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await authService.logout();
      navigate('/login', { replace: true });
    } catch {
      setError(
        'Logout could not be completed. Please retry to revoke your session.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <main className={tw('auth-page')}>
      <section className={tw('auth-panel')}>
        <h1>Log out of AdBorn ERP</h1>
        <p>End your session on this browser?</p>
        {error && <p role="alert">{error}</p>}
        <button onClick={logout} disabled={pending}>
          {pending ? 'Logging out…' : 'Log out'}
        </button>{' '}
        <Link to="/">Cancel</Link>
      </section>
    </main>
  );
}
