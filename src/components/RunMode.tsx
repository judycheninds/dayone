import { useEffect, useState } from 'react';
import { useStore, activeIndex, snapshotNowMin } from '../store';
import { categoryMap } from '../types';
import { fmtMin, fmtDur } from '../lib/time';
import { ensureNotifyPermission, scheduleNotices, clearNotices, notifyNow } from '../lib/notify';
import { isPipSupported } from '../lib/pip';
import { TimerCard } from './TimerCard';
import { PipPortal } from './PipPortal';
import { RewardsCard } from './RewardsCard';
import { Confetti } from './Confetti';
import { Card, SectionLabel, btnGhost, btnPrimary } from './ui';

export function RunMode() {
  const snap = useStore((s) => s.runSnapshot);
  const running = useStore((s) => s.running);
  const startDay = useStore((s) => s.startDay);
  const stopDay = useStore((s) => s.stopDay);
  const reflowExtend = useStore((s) => s.reflowExtend);
  const reflowFinish = useStore((s) => s.reflowFinish);
  const tasks = useStore((s) => s.tasks);
  const prefs = useStore((s) => s.prefs);
  const categories = useStore((s) => s.categories);
  const catOf = categoryMap(categories);

  const [now, setNow] = useState(() => new Date());
  const [pipOpen, setPipOpen] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  // 1-second tick while running.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Hand all "5 minutes left" reminders to the service worker whenever the
  // schedule snapshot changes — fires even when the tab is backgrounded.
  useEffect(() => {
    if (!running || !snap) {
      clearNotices();
      return;
    }
    const notices = snap.blocks
      .filter((b) => b.kind === 'task')
      .map((b) => ({
        id: b.id,
        title: '5 minutes left',
        body: `“${b.title}” is scheduled to wrap up soon.`,
        at: snap.anchorMs + (b.endMin - snap.anchorMin) * 60000 - 5 * 60000,
      }))
      .filter((n) => n.at > Date.now());
    scheduleNotices(notices);
  }, [running, snap]);

  useEffect(() => () => clearNotices(), []);

  // Derived run state (null-safe so hooks stay unconditional).
  const live = running && snap ? snap : null;
  const idx = live ? activeIndex(live, now) : -1;
  const done = !!live && idx < 0;
  const active = live && idx >= 0 ? live.blocks[idx] : null;
  const nowMin = live ? snapshotNowMin(live, now) : 0;
  const secondsLeft = active ? (active.endMin - nowMin) * 60 : 0;
  const fraction = active
    ? (nowMin - active.startMin) / Math.max(1, active.endMin - active.startMin)
    : 1;
  const color =
    active?.kind === 'task' ? catOf(active.category).color : '#38bdf8';

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;

  if (!running || !snap) {
    return (
      <Card>
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-500">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="text-lg font-semibold text-stone-900">Ready to focus?</div>
          <p className="mt-1.5 max-w-sm text-sm text-stone-500">
            {pendingCount > 0
              ? `Start your day and FlowDay runs your ${pendingCount} task${pendingCount > 1 ? 's' : ''} with a live timer, automatic breaks, and reminders.`
              : 'Add some tasks in the Plan tab first.'}
          </p>
          <button
            disabled={pendingCount === 0}
            onClick={async () => {
              await ensureNotifyPermission();
              startDay();
            }}
            className={`mt-6 px-7 py-3 ${btnPrimary}`}
          >
            Start day
          </button>
        </div>
      </Card>
    );
  }

  const upcoming = done ? [] : snap.blocks.slice(idx + 1);

  const handleFinish = () => {
    if (active?.kind === 'task' && active.taskId) {
      setConfettiKey((k) => k + 1); // celebrate completion in the bottom corner
      const t = tasks.find((x) => x.id === active.taskId);
      if (t?.reward && prefs.rewardsEnabled !== false) {
        notifyNow(
          'Reward unlocked! 🎁',
          `You earned "${t.reward}" for finishing ${t.title}. Notify ${prefs.parentName?.trim() || 'your parent'} to claim it.`,
        );
      }
    }
    reflowFinish();
  };

  const card = (compact: boolean) => (
    <TimerCard
      title={active?.title ?? ''}
      endMin={active?.endMin}
      color={color}
      secondsLeft={secondsLeft}
      fraction={fraction}
      isBreak={active?.kind === 'break'}
      done={done}
      compact={compact}
      onExtend={reflowExtend}
      onFinish={handleFinish}
    />
  );

  return (
    <div className="space-y-4">
      <Confetti fireKey={confettiKey} />
      <Card pad={false} className="overflow-hidden">
        <div className="min-h-[360px]">{card(false)}</div>
        <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3 text-xs">
          {isPipSupported() ? (
            <button onClick={() => setPipOpen((v) => !v)} className={`px-3 py-1.5 text-xs ${btnGhost}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="14" rx="2" />
                <rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor" />
              </svg>
              {pipOpen ? 'Close floating timer' : 'Pop out floating timer'}
            </button>
          ) : (
            <span className="text-stone-400">Floating timer needs Chrome / Edge</span>
          )}
          <button onClick={stopDay} className="text-stone-400 transition hover:text-rose-500">
            End day
          </button>
        </div>
      </Card>

      {!done && upcoming.length > 0 && (
        <Card>
          <SectionLabel>Up next</SectionLabel>
          <ul className="mt-3 space-y-1.5">
            {upcoming.map((b) => {
              const cat = catOf(b.category);
              return (
                <li key={b.id} className="flex items-center gap-3 rounded-xl border border-stone-200 px-3 py-2 text-sm">
                  <span className="w-20 shrink-0 tabular-nums text-xs text-stone-400">{fmtMin(b.startMin)}</span>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: b.kind === 'break' ? '#0ea5e9' : cat?.color }} />
                  <span className="flex-1 truncate text-stone-700">{b.kind === 'break' ? 'Break' : b.title}</span>
                  <span className="text-[11px] tabular-nums text-stone-500">{fmtDur(b.endMin - b.startMin)}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {done && <RewardsCard />}

      <PipPortal open={pipOpen} onClose={() => setPipOpen(false)}>
        {card(true)}
      </PipPortal>
    </div>
  );
}
