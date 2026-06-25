import { useState } from 'react';
import { resetPassword } from '../lib/api';
import { input, btnPrimary } from './ui';

/** Shown when the app is opened from a password-reset email link (?reset=token). */
export function ResetPassword({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password.');
    } finally {
      setBusy(false);
    }
  };

  const goToLogin = () => {
    window.history.replaceState({}, '', '/');
    window.location.reload();
  };

  return (
    <div className="grid min-h-full place-items-center p-5">
      <div className="w-full max-w-md fd-rise">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 via-rose-400 to-indigo-600 shadow-xl shadow-rose-300/60">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Reset password</h1>
        </div>

        <div className="rounded-3xl border border-black/[0.06] bg-[var(--card)] p-6 shadow-2xl sm:p-7">
          {done ? (
            <div className="text-center">
              <p className="mb-4 text-sm text-stone-600">
                Your password has been updated. You can log in with your new password.
              </p>
              <button onClick={goToLogin} className={`w-full py-3 ${btnPrimary}`}>
                Go to log in
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <label className="mb-3.5 block">
                <span className="mb-1.5 block text-sm text-stone-600">New password</span>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    required
                    minLength={6}
                    className={`${input} pr-11`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 hover:text-stone-700"
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? '🙈' : '👁'}
                  </button>
                </div>
              </label>

              {error && (
                <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy} className={`mt-2 w-full py-3 ${btnPrimary}`}>
                {busy ? 'Please wait…' : 'Set new password'}
              </button>
              <button
                type="button"
                onClick={goToLogin}
                className="mt-3 w-full text-center text-xs text-stone-500 transition hover:text-stone-700"
              >
                Back to log in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
