import { useState } from 'react';
import { fmtDur } from '../lib/time';
import { useOutsideClose } from '../lib/useOutsideClose';

/** Themed duration picker (hours + minutes) matching the time picker aesthetic. */
export function DurationField({
  value,
  onChange,
}: {
  value: number;
  onChange: (minutes: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));
  const h = Math.floor(value / 60);
  const m = value % 60;

  const compose = (hh: number, mm: number) => onChange(Math.max(5, hh * 60 + mm));

  const hours = [0, 1, 2, 3, 4, 5, 6, 7];
  const minutes = [0, 15, 30, 45];

  const cell = (selected: boolean) =>
    `rounded-lg py-1.5 text-sm tabular-nums transition ${
      selected
        ? 'bg-[var(--accent)] font-semibold text-white shadow-sm'
        : 'text-stone-600 hover:bg-black/[0.04]'
    }`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 transition hover:border-stone-300"
      >
        <span>{fmtDur(value)}</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-400">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
          <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-black/[0.06] bg-[var(--card)] p-3.5 shadow-[0_16px_40px_-12px_rgba(28,25,23,0.45)] fd-rise">
            <div className="mb-3 text-center text-2xl font-bold tracking-tight text-[var(--accent)]">
              {fmtDur(value)}
            </div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-stone-400">Hours</div>
            <div className="mb-3 grid grid-cols-8 gap-1">
              {hours.map((hh) => (
                <button type="button" key={hh} onClick={() => compose(hh, m)} className={cell(hh === h)}>
                  {hh}
                </button>
              ))}
            </div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-stone-400">Minutes</div>
            <div className="mb-3 grid grid-cols-4 gap-1">
              {minutes.map((mm) => (
                <button type="button" key={mm} onClick={() => compose(h, mm)} className={cell(mm === m)}>
                  {mm.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-lg bg-stone-900 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Done
            </button>
          </div>
      )}
    </div>
  );
}
