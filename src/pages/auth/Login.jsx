import { tw } from '../../lib/tailwind.js';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService.js';
import { useAuthStore } from '../../store/authStore.js';
import {
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  UsersRound,
  ClipboardCheck,
  BriefcaseBusiness,
  Network,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { defaultRouteForRole } from '../../config/navigation.js';

export default function Login() {
  const user = useAuthStore((state) => state.user);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [notice, setNotice] = useState('');
  if (user) return <Navigate to={defaultRouteForRole(user.role)} replace />;
  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const values = new FormData(event.currentTarget);
    setPending(true);
    setError('');
    setNotice('');
    try {
      if (resetMode) {
        const { data } = await api.post('/auth/forgot-password', {
          email: values.get('email').trim().toLowerCase(),
        });
        setNotice(data.message);
        return;
      }
      await authService.login({
        email: values.get('email').trim().toLowerCase(),
        password: values.get('password'),
      });
    } catch (failure) {
      setError(
        failure.response?.data?.error?.message ||
          'Unable to connect. Please try again.',
      );
    } finally {
      setPending(false);
    }
  }
  function changeMode(value) {
    setResetMode(value);
    setError('');
    setNotice('');
  }
  return (
    <main className={tw('login-page')}>
      <section className={tw('login-story')} aria-label="Welcome to AdBorn ERP">
        <div className={tw('login-story-content')}>
          <a
            className={tw('login-brand')}
            href="/login"
            aria-label="AdBorn Solutions"
          >
            <span className={tw('login-brand-icon')}>
              <img src="/adborn-mark.png" alt="" />
            </span>
            <span className={tw('login-wordmark')}>
              Adborn<small>Solutions</small>
            </span>
          </a>
          <span className={tw('login-eyebrow')}>WELCOME TO ADBORN ERP</span>
          <h1>
            Streamline
            <br />
            Your Business
            <br />
            <span>Operations</span>
          </h1>
          <p className={tw('login-intro')}>
            Manage your team, projects, clients, finances and more — all in one
            powerful platform designed for modern businesses.
          </p>
          <div className={tw('login-features')}>
            {[
              { Icon: UsersRound, line1: 'Manage', line2: 'Team' },
              { Icon: ClipboardCheck, line1: 'Track', line2: 'Projects' },
              { Icon: BriefcaseBusiness, line1: 'Handle', line2: 'Finances' },
              { Icon: Network, line1: 'Grow', line2: 'Together' },
            ].map(({ Icon, line1, line2 }) => (
              <div key={line1}>
                <span>
                  <Icon size={24} />
                </span>
                <p>
                  {line1}
                  <br />
                  {line2}
                </p>
              </div>
            ))}
          </div>
          <blockquote>
            “A centralized system{' '}
            <span>
              for a more
              <br className={tw('quote-break')} /> productive and connected
              team.
            </span>
            ”<cite>— AdBorn Solutions</cite>
          </blockquote>
        </div>
      </section>
      <section className={tw('login-form-region')}>
        <div className={tw('login-card')}>
          <div className={tw('login-ribbon')} aria-hidden="true" />
          <div className={tw('login-card-content')}>
            <h2>
              {resetMode ? 'Forgot your password?' : 'Sign in to AdBorn ERP'}
            </h2>
            <p className={tw('login-subtitle')}>
              {resetMode
                ? 'Enter your email to request secure reset instructions.'
                : 'Access your workspace and continue your journey.'}
            </p>
            <form onSubmit={submit} aria-busy={pending}>
              <div className={tw('login-field')}>
                <label htmlFor="email">Email</label>
                <div className={tw('login-input-wrap')}>
                  <Mail size={19} aria-hidden="true" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@adbornsolutions.com"
                    autoComplete="username"
                    required
                    maxLength={254}
                    disabled={pending}
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>
              </div>
              {!resetMode && (
                <>
                  <div className={tw('login-field')}>
                    <div className={tw('login-label-row')}>
                      <label htmlFor="password">Password</label>
                      <button
                        type="button"
                        className={tw('login-text-button')}
                        disabled={pending}
                        onClick={() => changeMode(true)}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className={tw('login-input-wrap')}>
                      <LockKeyhole size={19} aria-hidden="true" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        maxLength={128}
                        disabled={pending}
                        aria-describedby={error ? 'login-error' : undefined}
                      />
                      <button
                        type="button"
                        className={tw('password-toggle')}
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        aria-pressed={showPassword}
                        disabled={pending}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <Eye size={19} />
                        ) : (
                          <EyeOff size={19} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className={tw('login-session-note')}>
                    <LockKeyhole size={16} />
                    <div>
                      <strong>Secure sign-in</strong>
                      <p>
                        Your session stays active on this browser for up to 7
                        days.
                      </p>
                    </div>
                  </div>
                </>
              )}
              {error && (
                <p id="login-error" role="alert" className={tw('login-error')}>
                  {error}
                </p>
              )}
              {notice && (
                <p role="status" className={tw('login-notice')}>
                  {notice}
                </p>
              )}
              <button
                type="submit"
                className={tw('login-submit')}
                aria-label={resetMode ? 'Send reset instructions' : 'Log in'}
                disabled={pending}
              >
                {pending
                  ? resetMode
                    ? 'Sending…'
                    : 'Signing in…'
                  : resetMode
                    ? 'Send reset instructions'
                    : 'Sign In'}
                <span>
                  <ArrowRight size={22} />
                </span>
              </button>
              {resetMode && (
                <button
                  type="button"
                  className={tw('login-back login-text-button')}
                  disabled={pending}
                  onClick={() => changeMode(false)}
                >
                  <ArrowLeft size={16} />
                  Back to sign in
                </button>
              )}
            </form>
            <p className={tw('login-security')}>
              Protected access · AdBorn Solutions
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
