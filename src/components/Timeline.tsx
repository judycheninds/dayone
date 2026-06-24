import { useStore } from '../store';
import { categoryMap } from '../types';
import { fmtDur, fmtMin } from '../lib/time';
import { totalWorkMinutes } from '../lib/scheduler';
import { Card, SectionLabel } from './ui';

const PX_PER_MIN = 1.5;
const MIN_TASK_H = 52;
const MIN_BREAK_H = 30;

/** Readable text color (black/white) for a given background hex. */
function textOn(hex: string): string {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#1c1917' : '#ffffff';
}
/** Darken a hex color by fraction f for gradient depth. */
function shade(hex: string, f: number): string {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const d = (i: number) => Math.round(parseInt(n.slice(i, i + 2), 16) * (1 - f));
  return `rgb(${d(0)},${d(2)},${d(4)})`;
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
          <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-medium text-stone-500">
            {fmtDur(work)} work · ends {fmtMin(result.endLimitMin)}
          </span>
        )}
      </div>

      {!hasPending ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-black/[0.06] bg-black/[0.02] text-stone-400">
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
          <Marker time={fmtMin(startMin)} label="Start" />

          <ol className="flex flex-col gap-2">
            {result.blocks.map((b) => {
              const dur = b.endMin - b.startMin;
              if (b.kind === 'break') {
                const h = Math.max(MIN_BREAK_H, dur * PX_PER_MIN);
                return (
                  <li key={b.id} style={{ height: h }} className="flex items-stretch gap-3">
                    <Time t={fmtMin(b.startMin)} />
                    <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300/80 text-xs font-medium text-stone-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-sky-500">
                        <path d="M18 8h1a3 3 0 0 1 0 6h-1M4 8h14v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8zM6 2v2M10 2v2M14 2v2" />
                      </svg>
                      {fmtDur(dur)} break
                    </div>
                  </li>
                );
              }

              const cat = catOf(b.category);
              const h = Math.max(MIN_TASK_H, dur * PX_PER_MIN);
              const fg = textOn(cat.color);
              const soft = fg === '#ffffff' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.10)';
              const isPart = !!b.part;
              const continues = isPart && b.part!.index > 1;

              return (
                <li key={b.id} style={{ height: h }} className="flex items-stretch gap-3">
                  <Time t={fmtMin(b.startMin)} />
                  <div
                    className="relative flex flex-1 flex-col justify-center overflow-hidden rounded-2xl px-4 py-2.5 shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${cat.color}, ${shade(cat.color, 0.16)})`, color: fg }}
                  >
                    {/* dashed seam on continued parts */}
                    {continues && (
                      <span
                        className="absolute left-0 top-0 h-full border-l-2 border-dashed"
                        style={{ borderColor: soft }}
                      />
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {continues && (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                              <path d="M4 9h11a4 4 0 0 1 0 8h-1M4 9l4-4M4 9l4 4" />
                            </svg>
                          )}
                          <span className="truncate font-semibold leading-tight">{b.title}</span>
                        </div>
                        <div className="mt-0.5 truncate text-[11px]" style={{ opacity: 0.82 }}>
                          {cat.label} · {fmtMin(b.startMin)}–{fmtMin(b.endMin)}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[11px] font-semibold tabular-nums" style={{ opacity: 0.95 }}>
                          {fmtDur(dur)}
                        </span>
                        {isPart && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                            style={{ background: soft, color: fg }}
                          >
                            {b.part!.index}/{b.part!.total}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <Marker time={fmtMin(result.endLimitMin)} label="Bedtime" />
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

function Time({ t }: { t: string }) {
  return (
    <span className="w-14 shrink-0 pt-2 text-right text-xs font-medium tabular-nums text-stone-400">
      {t}
    </span>
  );
}

function Marker({ time, label }: { time: string; label: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-stone-400">
      <span className="w-14 shrink-0 text-right tabular-nums normal-case">{time}</span>
      <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
      <span className="flex-1 border-t border-dashed border-stone-200" />
      <span>{label}</span>
    </div>
  );
}
