import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { categoryMap } from '../types';
import { localDateKey } from '../lib/time';

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmtDay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtFull = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** "View previous days": a weekly planner (due/done counts, archived) + a daily completed log. */
export function HistoryModal({ onClose }: { onClose: () => void }) {
  const history = useStore((s) => s.history);
  const tasks = useStore((s) => s.tasks);
  const categories = useStore((s) => s.categories);
  const catOf = categoryMap(categories);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = last week, …

  const todayKey = localDateKey(new Date());

  // Sunday-anchored week for the selected offset.
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekOffset * 7);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = localDateKey(d);
    const done = history.find((h) => h.date === key)?.tasks.length ?? 0;
    // "Important" tasks (4–5★) due that day — only meaningful for the current/upcoming week.
    const due = tasks.filter(
      (t) => t.status === 'pending' && t.importance >= 4 && localDateKey(new Date(t.dueISO)) === key,
    ).length;
    return { d, key, done, due, isToday: key === todayKey };
  });

  const weekEnd = days[6].d;
  const weekDone = days.reduce((s, x) => s + x.done, 0);
  const weekLabel = weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Last week' : `${weekOffset} weeks ago`;

  const log = [...history].filter((h) => h.tasks.length > 0).sort((a, b) => (a.date < b.date ? 1 : -1));

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[var(--card)] p-5 shadow-2xl sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-stone-900">Previous days</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            ✕
          </button>
        </div>

        {/* Weekly planner */}
        <div className="rounded-2xl border border-black/[0.06] bg-white/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => setWeekOffset((w) => w + 1)} className="grid h-7 w-7 place-items-center rounded-full text-stone-500 hover:bg-stone-100" aria-label="Previous week">
              ‹
            </button>
            <div className="text-center leading-tight">
              <div className="text-sm font-semibold text-stone-800">{weekLabel}</div>
              <div className="text-[11px] text-stone-400">
                {fmtDay(weekStart)} – {fmtDay(weekEnd)}
              </div>
            </div>
            <button
              onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
              disabled={weekOffset === 0}
              className="grid h-7 w-7 place-items-center rounded-full text-stone-500 enabled:hover:bg-stone-100 disabled:opacity-30"
              aria-label="Next week"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map((x) => (
              <div
                key={x.key}
                className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 ${
                  x.isToday ? 'border-[var(--accent)] bg-[var(--accent-weak)]' : 'border-stone-200/70'
                }`}
              >
                <span className="text-[10px] font-medium uppercase tracking-wide text-stone-400">{WD[x.d.getDay()]}</span>
                <span className={`text-sm font-semibold ${x.isToday ? 'text-[var(--accent)]' : 'text-stone-700'}`}>{x.d.getDate()}</span>
                <span className={`text-[11px] font-semibold tabular-nums ${x.done > 0 ? 'text-emerald-600' : 'text-stone-300'}`}>✓{x.done}</span>
                {x.due > 0 && <span className="rounded bg-amber-100 px-1 text-[10px] font-medium tabular-nums text-amber-700">{x.due} due</span>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-stone-500">
            {weekDone === 0 ? 'No tasks completed this week yet.' : `${weekDone} task${weekDone === 1 ? '' : 's'} completed this week`}
            {' · ✓ done · '}
            <span className="text-amber-700">due = important tasks</span>
          </p>
        </div>

        {/* Daily completed log */}
        <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-stone-400">Completed each day</h3>
        {log.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-400">
            Finish tasks in Run mode and they'll show up here, day by day.
          </p>
        ) : (
          <ul className="space-y-3">
            {log.map((day) => (
              <li key={day.date} className="rounded-2xl border border-black/[0.06] bg-white/60 p-3.5">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-stone-800">{fmtFull(new Date(day.date + 'T00:00:00'))}</span>
                  <span className="text-xs text-stone-400">
                    {day.tasks.length} done{day.date === todayKey ? ' · today' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {day.tasks.map((t, i) => {
                    const cat = catOf(t.category);
                    return (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2 py-1 text-xs text-stone-600">
                        <span className="h-2 w-2 rounded-full" style={{ background: cat.color }} />
                        {t.title}
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}
