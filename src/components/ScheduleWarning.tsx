import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { fmtDur, fmtMin } from '../lib/time';

/**
 * Centered warning shown when the planned tasks don't fit between the start time
 * and bedtime (minus wind-down). Offers to push bedtime later or remove tasks.
 */
export function ScheduleWarning() {
  const schedule = useStore((s) => s.schedule);
  const prefs = useStore((s) => s.prefs);
  const updatePrefs = useStore((s) => s.updatePrefs);

  const result = schedule(new Date());
  const overflow = result.overflow;
  const overMin = overflow.reduce((sum, t) => sum + t.estMinutes, 0);

  const [dismissed, setDismissed] = useState(false);
  const prev = useRef(overflow.length);
  useEffect(() => {
    if (overflow.length !== prev.current) {
      if (overflow.length > 0) setDismissed(false); // a new overflow → re-show
      prev.current = overflow.length;
    }
  }, [overflow.length]);

  if (overflow.length === 0 || dismissed) return null;

  const needed = Math.max(15, Math.ceil(overMin / 15) * 15);
  const newSleep = (prefs.sleepMin + needed) % 1440;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-stone-900/60 p-4 pt-16 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl border border-black/[0.06] bg-[var(--card)] p-6 text-center shadow-2xl fd-rise">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-stone-900">Your schedule may not fit</h2>
        <p className="mt-1.5 text-sm text-stone-600">
          You've planned about <strong>{fmtDur(overMin)}</strong> more than fits before your
          bedtime ({fmtMin(result.endLimitMin)}). Push your bedtime later, or remove a few tasks.
        </p>

        <div className="mt-5 space-y-2">
          <button
            onClick={() => updatePrefs({ sleepMin: newSleep })}
            className="w-full rounded-xl bg-stone-900 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Move bedtime to {fmtMin(newSleep)}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-full rounded-xl border border-stone-200 bg-white/60 py-3 text-sm font-medium text-stone-600 transition hover:border-stone-300"
          >
            I'll remove some tasks
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
