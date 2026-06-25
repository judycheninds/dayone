import { useEffect, useState } from 'react';
import { useStore } from './store';
import { fmtMin } from './lib/time';
import { verifyEmail } from './lib/api';
import { Onboarding } from './components/Onboarding';
import { TaskEntry } from './components/TaskEntry';
import { Timeline } from './components/Timeline';
import { RunMode } from './components/RunMode';
import { RewardsCard } from './components/RewardsCard';
import { TaskDetailsCard } from './components/TaskDetailsCard';
import { ScheduleWarning } from './components/ScheduleWarning';
import { Settings } from './components/Settings';
import { Sync } from './components/Sync';
import { ResetPassword } from './components/ResetPassword';
import { VerifyBanner } from './components/VerifyBanner';
import { TimeBackground } from './components/TimeBackground';
import { TimeField } from './components/TimeField';

const PARAMS = new URLSearchParams(window.location.search);
const RESET_TOKEN = PARAMS.get('reset');

export default function App() {
  const account = useStore((s) => s.account);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const prefs = useStore((s) => s.prefs);
  const startMin = useStore((s) => s.startMin);
  const setStartMin = useStore((s) => s.setStartMin);
  const running = useStore((s) => s.running);
  const cloudUser = useStore((s) => s.cloudUser);
  const [showSettings, setShowSettings] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');

  // Handle an email-verification link (?verify=token) on load.
  useEffect(() => {
    const token = PARAMS.get('verify');
    if (!token) return;
    verifyEmail(token)
      .then(() => {
        useStore.getState().setEmailVerified(true);
        setVerifyMsg('Email verified ✓');
      })
      .catch((e) => setVerifyMsg(e instanceof Error ? e.message : 'Verification failed'))
      .finally(() => window.history.replaceState({}, '', window.location.pathname));
  }, []);

  // A password-reset link short-circuits everything else.
  if (RESET_TOKEN) {
    return (
      <>
        <TimeBackground />
        <ResetPassword token={RESET_TOKEN} />
      </>
    );
  }

  if (!account) {
    return (
      <>
        <TimeBackground />
        <Sync />
        {verifyMsg && (
          <div className="fixed left-1/2 top-4 z-[90] -translate-x-1/2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
            {verifyMsg}
          </div>
        )}
        <Onboarding />
      </>
    );
  }

  return (
    <div className="mx-auto min-h-full max-w-3xl px-4 pb-20 sm:px-6">
      <TimeBackground />
      <Sync />

      <header className="flex items-center justify-between gap-3 py-6">
        <div className="flex items-center gap-2.5">
          <Logo />
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight text-stone-900">DayOne</div>
            <div className="text-xs text-stone-500">Hi, {account.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-stone-200 bg-stone-100/70 p-1">
            <Seg active={view === 'plan'} onClick={() => setView('plan')}>
              Plan
            </Seg>
            <Seg active={view === 'run'} onClick={() => setView('run')}>
              <span className="flex items-center gap-1.5">
                Run
                {running && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                )}
              </span>
            </Seg>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:border-stone-300 hover:text-stone-900"
            aria-label="Settings"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {verifyMsg && (
        <div className="fixed left-1/2 top-4 z-[90] -translate-x-1/2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {verifyMsg}
        </div>
      )}
      <VerifyBanner />

      {view === 'plan' ? (
        <div className="space-y-4 fd-rise">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-black/[0.06] bg-[var(--card)] px-4 py-3 text-sm text-stone-600 shadow-sm">
            <span>Starting at</span>
            <TimeField value={startMin} onChange={setStartMin} />
            <span>
              · sleep by{' '}
              <span className="font-semibold text-[var(--accent)]">{fmtMin(prefs.sleepMin)}</span>
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-stone-400">
              {cloudUser ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Synced across devices
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-300" /> Saved on this device
                </>
              )}
            </span>
          </div>
          <TaskEntry />
          <Timeline />
          <TaskDetailsCard />
          <RewardsCard />
        </div>
      ) : (
        <div className="fd-rise">
          <RunMode />
        </div>
      )}

      {/* Rendered outside any transformed (fd-rise) container so `fixed` is
          relative to the viewport — centers and darkens the whole tab. */}
      {view === 'plan' && <ScheduleWarning />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function Logo() {
  return (
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 via-rose-400 to-indigo-600 shadow-lg shadow-rose-300/50">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 1.5" />
        <path d="M9 2.5h6" />
      </svg>
    </div>
  );
}

function Seg({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-white text-[var(--accent)] shadow-sm'
          : 'text-stone-500 hover:text-stone-900'
      }`}
    >
      {children}
    </button>
  );
}
