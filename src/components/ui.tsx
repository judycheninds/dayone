import type { ReactNode } from 'react';

/** Clean white surface card. */
export function Card({
  children,
  className = '',
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(28,25,23,0.05),0_20px_44px_-22px_rgba(28,25,23,0.4)] ${
        pad ? 'p-5 sm:p-6' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
      {children}
    </h2>
  );
}

/** Reusable input class (light, rounded, soft focus). */
export const input =
  'w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-weak)]';

/** Primary "ink" button — premium near-black. */
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 font-medium text-white shadow-[0_6px_16px_-6px_rgba(28,25,23,0.5)] transition hover:bg-stone-800 active:scale-[0.99] disabled:opacity-40 disabled:active:scale-100';

/** Subtle ghost button. */
export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 active:scale-[0.99]';
