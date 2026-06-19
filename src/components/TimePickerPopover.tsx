import { fmtMin } from '../lib/time';

/** A small, themed time picker (hour / minute / AM-PM) — prettier than the native dialog. */
export function TimePickerPopover({
  value,
  onChange,
  onClose,
}: {
  value: number;
  onChange: (minutes: number) => void;
  onClose: () => void;
}) {
  const total = ((value % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const minute = total % 60;
  const ampm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;

  const compose = (hh: number, mm: number, ap: 'AM' | 'PM') => {
    let h = hh % 12;
    if (ap === 'PM') h += 12;
    onChange((h * 60 + mm) % 1440);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const cell = (selected: boolean) =>
    `rounded-lg py-1.5 text-sm tabular-nums transition ${
      selected
        ? 'bg-[var(--accent)] font-semibold text-white shadow-sm'
        : 'text-stone-600 hover:bg-black/[0.04]'
    }`;

  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-black/[0.06] bg-[var(--card)] p-3.5 shadow-[0_16px_40px_-12px_rgba(28,25,23,0.45)] fd-rise">
        <div className="mb-3 text-center text-2xl font-bold tracking-tight text-[var(--accent)]">
          {fmtMin(value)}
        </div>

        <div className="mb-1 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-stone-400">
          <span>Hour</span>
        </div>
        <div className="mb-3 grid grid-cols-6 gap-1">
          {hours.map((h) => (
            <button type="button" key={h} onClick={() => compose(h, minute, ampm)} className={cell(h === h12)}>
              {h}
            </button>
          ))}
        </div>

        <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-stone-400">Minute</div>
        <div className="mb-3 grid grid-cols-6 gap-1">
          {minutes.map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => compose(h12, m, ampm)}
              className={cell(m === minute - (minute % 5))}
            >
              {m.toString().padStart(2, '0')}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex flex-1 rounded-lg border border-black/[0.07] p-0.5">
            {(['AM', 'PM'] as const).map((ap) => (
              <button
                type="button"
                key={ap}
                onClick={() => compose(h12, minute, ap)}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
                  ampm === ap ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-stone-500'
                }`}
              >
                {ap}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-stone-900 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Done
          </button>
        </div>
    </div>
  );
}
