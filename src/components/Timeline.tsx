import { useStore } from '../store';
import { categoryMap } from '../types';
import { fmtDur, fmtMin } from '../lib/time';
import { totalWorkMinutes } from '../lib/scheduler';
import { Card, SectionLabel } from './ui';

const PX_PER_MIN = 1.35;
const MIN_TASK_H = 46;
const MIN_BREAK_H = 30;

/** Pick readable text color (black/white) for a given background hex. */
function textOn(hex: string): string {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#1c1917' : '#ffffff';
}

export function Timeline() {
  const schedule = useStore((s) => s.schedule);
  const startMin = useStore((s) => s.startMin);
  const tasks = useStore((s) => s.tasks);
  const categories = useStore((s) => s.categories);
  const catOf = categoryMap(categories);

  const result = schedule(new Date());
  const work = totalWorkMinutes(result);
  const hasPending = tasks.some((t) => t.status === 'pending');

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionLabel>Optimized schedule</SectionLabel>
        {hasPending && (
          <span className="text-xs text-stone-400">
            {fmtDur(work)} work · ends {fmtMin(result.endLimitMin)}
          </span>
        )}
      </div>

      {!hasPending ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <path d="M3 9h18M8 2v4M16 2v4" />
            </svg>
          </div>
          <p className="text-sm text-stone-500">
            Add tasks above and they'll be optimized into your evening here.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center gap-3 text-xs text-stone-400">
            <span className="w-16 shrink-0 text-right tabular-nums">{fmtMin(startMin)}</span>
            <span className="flex-1 border-t border-dashed border-stone-200" />
            <span>start</span>
          </div>

          <ol className="flex flex-col gap-1.5">
            {result.blocks.map((b) => {
              const dur = b.endMin - b.startMin;
              if (b.kind === 'break') {
                const h = Math.max(MIN_BREAK_H, dur * PX_PER_MIN);
                return (
                  <li key={b.id} style={{ height: h }} className="flex gap-3">
                    <span className="w-16 shrink-0 pt-1 text-right text-xs tabular-nums text-stone-400">
                      {fmtMin(b.startMin)}
                    </span>
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 text-xs text-stone-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-sky-500">
                        <path d="M18 8h1a3 3 0 0 1 0 6h-1M4 8h14v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8zM6 2v2M10 2v2M14 2v2" />
                      </svg>
                      Break · {fmtDur(dur)}
                    </div>
                  </li>
                );
              }
              const cat = catOf(b.category);
              const h = Math.max(MIN_TASK_H, dur * PX_PER_MIN);
              const fg = textOn(cat.color);
              return (
                <li key={b.id} style={{ height: h }} className="flex gap-3">
                  <span className="w-16 shrink-0 pt-1 text-right text-xs tabular-nums text-stone-400">
                    {fmtMin(b.startMin)}
                  </span>
                  <div
                    className="flex flex-1 flex-col justify-center overflow-hidden rounded-xl px-3.5 py-2 shadow-sm"
                    style={{ background: cat.color, color: fg }}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold">{b.title}</span>
                      <span className="shrink-0 text-[11px] tabular-nums" style={{ color: fg, opacity: 0.85 }}>
                        {fmtDur(dur)}
                      </span>
                    </div>
                    <div className="truncate text-[11px]" style={{ color: fg, opacity: 0.8 }}>
                      {cat.label} · {fmtMin(b.startMin)}–{fmtMin(b.endMin)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-stone-400">
            <span className="w-16 shrink-0 text-right tabular-nums">{fmtMin(result.endLimitMin)}</span>
            <span className="flex-1 border-t border-dashed border-stone-200" />
            <span>wind down</span>
          </div>
        </div>
      )}

      {result.overflow.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-3.5">
          <p className="mb-1.5 flex items-center gap-2 text-sm font-medium text-amber-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
            Won't fit before bedtime
          </p>
          <ul className="space-y-1 pl-1 text-sm text-amber-700/80">
            {result.overflow.map((t) => (
              <li key={t.id}>• {t.title} ({fmtDur(t.estMinutes)}) — defer or shorten</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
