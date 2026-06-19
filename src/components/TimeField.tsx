import { useEffect, useState } from 'react';
import { fmtMin, parseFlexibleTime } from '../lib/time';
import { useOutsideClose } from '../lib/useOutsideClose';
import { TimePickerPopover } from './TimePickerPopover';

/**
 * Time control that supports direct typing (e.g. "3:30 PM") *and* a pretty,
 * themed picker popover (the clock button), keeping a familiar selection system.
 */
export function TimeField({
  value,
  onChange,
}: {
  value: number;
  onChange: (minutes: number) => void;
}) {
  const [text, setText] = useState(() => fmtMin(value));
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLSpanElement>(open, () => setOpen(false));

  // Reflect external changes (e.g. picking from the popover).
  useEffect(() => {
    setText(fmtMin(value));
  }, [value]);

  const commit = () => {
    const m = parseFlexibleTime(text);
    if (m != null) onChange(m);
    else setText(fmtMin(value)); // revert invalid input
  };

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 transition focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-weak)]"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
        inputMode="text"
        aria-label="Start time"
        className="w-[4.5rem] bg-transparent text-sm text-stone-900 outline-none"
      />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid place-items-center text-stone-400 transition hover:text-[var(--accent)]"
        aria-label="Open time picker"
        title="Pick a time"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" />
        </svg>
      </button>
      {open && <TimePickerPopover value={value} onChange={onChange} onClose={() => setOpen(false)} />}
    </span>
  );
}
