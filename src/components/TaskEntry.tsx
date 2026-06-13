import { useState } from 'react';
import { useStore } from '../store';
import { categoryMap, type Category, type Importance } from '../types';
import { DUE_PRESETS, type DuePreset, dueLabel, resolveDue } from '../lib/dueDate';
import { fmtDur } from '../lib/time';
import { Card, SectionLabel, input, btnPrimary } from './ui';

export function TaskEntry() {
  const tasks = useStore((s) => s.tasks);
  const categories = useStore((s) => s.categories);
  const addTask = useStore((s) => s.addTask);
  const removeTask = useStore((s) => s.removeTask);
  const clearCompleted = useStore((s) => s.clearCompleted);
  const catOf = categoryMap(categories);
  const done = tasks.filter((t) => t.status === 'done');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('homework');
  const [importance, setImportance] = useState<Importance>(3);
  const [duePreset, setDuePreset] = useState<DuePreset>('tomorrow');
  const [dueDate, setDueDate] = useState('');
  const [est, setEst] = useState(45);
  const [reward, setReward] = useState('');

  const now = new Date();
  const pending = tasks.filter((t) => t.status === 'pending');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      category,
      importance,
      dueISO: resolveDue(duePreset, now, dueDate),
      estMinutes: est,
      reward: reward.trim() || undefined,
    });
    setTitle('');
    setEst(45);
    setReward('');
  };

  const selCls =
    'w-full appearance-none rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200';

  return (
    <Card>
      <SectionLabel>Brain dump</SectionLabel>

      <form onSubmit={submit} className="mt-3 space-y-3.5">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need to do?  e.g. Calc problem set"
          className={`${input} py-3 text-[15px]`}
        />

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = category === c.id;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  on
                    ? 'text-stone-900'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
                style={on ? { background: `${c.color}22`, borderColor: `${c.color}99` } : undefined}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-xs text-stone-500">Due</span>
            <select value={duePreset} onChange={(e) => setDuePreset(e.target.value as DuePreset)} className={selCls}>
              {DUE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          {duePreset === 'date' && (
            <label className="block">
              <span className="mb-1.5 block text-xs text-stone-500">Date</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={selCls} />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs text-stone-500">Importance</span>
            <select value={importance} onChange={(e) => setImportance(Number(e.target.value) as Importance)} className={selCls}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {'★'.repeat(n)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-stone-500">Est. time</span>
            <select value={est} onChange={(e) => setEst(Number(e.target.value))} className={selCls}>
              {[15, 30, 45, 60, 90, 120, 150, 180].map((m) => (
                <option key={m} value={m}>
                  {fmtDur(m)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </span>
          <input
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="Reward when done (optional) — e.g. $5, 30 min screen time"
            className={`${input} pl-9`}
          />
        </div>

        <button type="submit" className={`w-full py-2.5 text-sm ${btnPrimary}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add task
        </button>
      </form>

      {pending.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {pending.map((t) => {
            const cat = catOf(t.category);
            return (
              <li
                key={t.id}
                className="group flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm transition hover:border-stone-300"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cat.color }} />
                <span className="flex-1 truncate text-stone-800">
                  {t.title}
                  {t.reward && (
                    <span className="ml-2 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      🎁 {t.reward}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-amber-500">{'★'.repeat(t.importance)}</span>
                <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-500">
                  {dueLabel(t.dueISO, now)}
                </span>
                <span className="text-[11px] tabular-nums text-stone-500">{fmtDur(t.estMinutes)}</span>
                <button
                  onClick={() => removeTask(t.id)}
                  className="ml-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-stone-400 transition hover:bg-rose-50 hover:text-rose-500"
                  aria-label="Delete task"
                  title="Delete task"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {done.length > 0 && (
        <div className="mt-4 border-t border-stone-100 pt-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
              Completed ({done.length})
            </span>
            <button onClick={clearCompleted} className="text-xs text-stone-400 transition hover:text-rose-500">
              Clear all
            </button>
          </div>
          <ul className="space-y-1">
            {done.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm text-stone-400">
                <span className="text-emerald-500">✓</span>
                <span className="flex-1 truncate line-through">{t.title}</span>
                <button
                  onClick={() => removeTask(t.id)}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-stone-300 transition hover:bg-rose-50 hover:text-rose-500"
                  aria-label="Delete task"
                  title="Delete task"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
