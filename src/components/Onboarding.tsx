import { useState } from 'react';
import { useStore } from '../store';
import { BREAK_CADENCES, BREAK_LENGTHS, DEFAULT_PREFS, WINDDOWN_OPTIONS } from '../types';
import { input, btnPrimary } from './ui';
import { TimeField } from './TimeField';

type Mode = 'signup' | 'login';

export function Onboarding() {
  const signupLocal = useStore((s) => s.signupLocal);
  const loginLocal = useStore((s) => s.loginLocal);

  const [mode, setMode] = useState<Mode>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sleep, setSleep] = useState(23 * 60);
  const [windDown, setWindDown] = useState(30);
  const [cadence, setCadence] = useState(60);
  const [breakLen, setBreakLen] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) return setError('Please choose a username.');
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signupLocal(username.trim(), email.trim(), password, {
          ...DEFAULT_PREFS,
          sleepMin: sleep,
          windDownMin: windDown,
          breakCadence: cadence,
          breakMinutes: breakLen,
        });
      } else {
        await loginLocal(username.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className="grid min-h-full place-items-center p-5">
      <div className="w-full max-w-md fd-rise">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 via-rose-400 to-indigo-600 shadow-xl shadow-rose-300/60">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 1.5" />
              <path d="M9 2.5h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">DayOne</h1>
          <p className="mt-1.5 max-w-xs text-sm text-stone-500">
            Plan your evening, beat your bedtime. An optimized schedule for everything
            after the school bell.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-black/[0.06] bg-[var(--card)] p-6 shadow-[0_1px_3px_rgba(28,25,23,0.05),0_24px_50px_-28px_rgba(28,25,23,0.45)] sm:p-7"
        >
          <div className="mb-5 flex rounded-full border border-stone-200 bg-stone-100/70 p-1">
            {(['signup', 'login'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError('');
                }}
                className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${
                  mode === m ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                }`}
              >
                {m === 'signup' ? 'Create account' : 'Log in'}
              </button>
            ))}
          </div>

          <Field label="Username">
            <input
              className={input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="alex"
              autoComplete="username"
            />
          </Field>

          {isSignup && (
            <Field label="Email">
              <input
                type="email"
                required
                className={input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@school.edu"
                autoComplete="email"
              />
            </Field>
          )}

          <Field label="Password">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                className={`${input} pr-11`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a18 18 0 0 1-2.16 3.19M6.6 6.6A18 18 0 0 0 2 12s3 8 10 8a9 9 0 0 0 5.4-1.6" />
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M1 1l22 22" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </Field>

          {isSignup && (
            <>
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-stone-200" />
                <span className="text-[11px] uppercase tracking-[0.14em] text-stone-400">
                  Daily targets
                </span>
                <div className="h-px flex-1 bg-stone-200" />
              </div>

              <Field label="I want to be asleep by">
                <TimeField value={sleep} onChange={setSleep} />
              </Field>

              <Field label="Wind-down buffer (no tasks before sleep)">
                <div className="flex flex-wrap gap-2">
                  {WINDDOWN_OPTIONS.map((w) => (
                    <button
                      type="button"
                      key={w}
                      onClick={() => setWindDown(w)}
                      className={`flex-1 rounded-xl border px-2 py-2.5 text-sm transition ${
                        windDown === w
                          ? 'border-[var(--accent)] bg-[var(--accent-weak)] text-[var(--accent)]'
                          : 'border-stone-200 text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      {w}m
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Take a break every">
                <div className="flex flex-wrap gap-2">
                  {BREAK_CADENCES.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCadence(c)}
                      className={`flex-1 rounded-xl border px-2 py-2.5 text-sm transition ${
                        cadence === c
                          ? 'border-[var(--accent)] bg-[var(--accent-weak)] text-[var(--accent)]'
                          : 'border-stone-200 text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      {c}m
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Break length">
                <div className="flex gap-2">
                  {BREAK_LENGTHS.map((b) => (
                    <button
                      type="button"
                      key={b}
                      onClick={() => setBreakLen(b)}
                      className={`flex-1 rounded-xl border px-2 py-2.5 text-sm transition ${
                        breakLen === b
                          ? 'border-[var(--accent)] bg-[var(--accent-weak)] text-[var(--accent)]'
                          : 'border-stone-200 text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      {b}m
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {error && (
            <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className={`mt-2 w-full py-3 ${btnPrimary}`}>
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setError('');
              setBusy(true);
              try {
                await loginLocal('tester', 'test1234');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not open demo.');
              } finally {
                setBusy(false);
              }
            }}
            className="mt-3 w-full rounded-xl border border-dashed border-stone-300 py-2.5 text-sm font-medium text-stone-600 transition hover:border-stone-400 hover:bg-stone-50"
          >
            ✨ Try the demo account
          </button>
          <p className="mt-2 text-center text-xs text-stone-400">
            Demo login — username <span className="font-medium text-stone-500">tester</span> ·
            password <span className="font-medium text-stone-500">test1234</span>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3.5 block">
      <span className="mb-1.5 block text-sm text-stone-600">{label}</span>
      {children}
    </label>
  );
}
