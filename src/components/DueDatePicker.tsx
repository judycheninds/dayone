import { useState } from 'react';
import { dueLabel } from '../lib/dueDate';
import { DAY_MS } from '../lib/time';
import { useOutsideClose } from '../lib/useOutsideClose';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function endOfDayISO(d: Date): string {
  const e = new Date(d);
  e.setHours(23, 59, 0, 0);
  return e.toISOString();
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** A themed mini calendar for picking a due date, with quick presets and a close button. */
export function DueDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const now = new Date();
  const selected = new Date(value);
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));
  const [view, setView] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));

  const pick = (d: Date) => {
    onChange(endOfDayISO(d));
    setOpen(false);
  };
  const preset = (days: number) => pick(new Date(now.getTime() + days * DAY_MS));

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const chip = 'rounded-full border border-black/[0.07] px-2.5 py-1 text-xs text-stone-600 transition hover:border-[var(--accent)] hover:text-[var(--accent)]';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 transition hover:border-stone-300"
      >
        <span>{dueLabel(value, now)}</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400">
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <path d="M3 9h18M8 2v4M16 2v4" />
        </svg>
      </button>

      {open && (
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-black/[0.06] bg-[var(--card)] p-3.5 shadow-[0_16px_40px_-12px_rgba(28,25,23,0.45)] fd-rise">
            <div className="mb-2.5 flex items-center justify-between">
              <button type="button" onClick={() => setView(new Date(year, month - 1, 1))} className="grid h-7 w-7 place-items-center rounded-lg text-stone-500 transition hover:bg-black/[0.05]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <span className="text-sm font-semibold text-stone-800">
                {view.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setView(new Date(year, month + 1, 1))} className="grid h-7 w-7 place-items-center rounded-lg text-stone-500 transition hover:bg-black/[0.05]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close calendar" className="grid h-7 w-7 place-items-center rounded-lg text-stone-500 transition hover:bg-rose-50 hover:text-rose-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase text-stone-400">
              {WEEKDAYS.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) =>
                d ? (
                  <button
                    type="button"
                    key={i}
                    onClick={() => pick(d)}
                    className={`grid h-8 place-items-center rounded-lg text-sm tabular-nums transition ${
                      sameDay(d, selected)
                        ? 'bg-[var(--accent)] font-semibold text-white shadow-sm'
                        : sameDay(d, now)
                          ? 'text-[var(--accent)] ring-1 ring-[var(--accent)]'
                          : 'text-stone-700 hover:bg-black/[0.05]'
                    }`}
                  >
                    {d.getDate()}
                  </button>
                ) : (
                  <span key={i} />
                ),
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <button type="button" onClick={() => preset(0)} className={chip}>Today</button>
              <button type="button" onClick={() => preset(1)} className={chip}>Tomorrow</button>
              <button type="button" onClick={() => preset(3)} className={chip}>In 3 days</button>
              <button type="button" onClick={() => preset(7)} className={chip}>Next week</button>
            </div>
          </div>
      )}
    </div>
  );
}
