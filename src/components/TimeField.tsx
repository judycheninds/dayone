import { useEffect, useRef, useState } from 'react';
import { fmtMin, parseFlexibleTime, parseHHMM, toHHMM } from '../lib/time';

/**
 * Time control that supports direct typing (e.g. "3:30 PM") *and* the native
 * time picker (the clock button), keeping the familiar selection system.
 */
export function TimeField({
  value,
  onChange,
}: {
  value: number;
  onChange: (minutes: number) => void;
}) {
  const [text, setText] = useState(() => fmtMin(value));
  const picker = useRef<HTMLInputElement>(null);

  // Reflect external changes (e.g. picking from the native dialog).
  useEffect(() => {
    setText(fmtMin(value));
  }, [value]);

  const commit = () => {
    const m = parseFlexibleTime(text);
    if (m != null) onChange(m);
    else setText(fmtMin(value)); // revert invalid input
  };

  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 transition focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-weak)]">
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
        onClick={() => picker.current?.showPicker?.()}
        className="grid place-items-center text-stone-400 transition hover:text-[var(--accent)]"
        aria-label="Open time picker"
        title="Pick a time"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" />
        </svg>
      </button>
      <input
        ref={picker}
        type="time"
        value={toHHMM(value)}
        onChange={(e) => onChange(parseHHMM(e.target.value))}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
    </span>
  );
}
