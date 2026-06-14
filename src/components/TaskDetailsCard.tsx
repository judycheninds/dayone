import { useState } from 'react';
import { useStore } from '../store';
import { categoryMap } from '../types';
import { Card, SectionLabel } from './ui';

/** A section (placed above Rewards) for adding free-form details/notes per task. */
export function TaskDetailsCard() {
  const tasks = useStore((s) => s.tasks);
  const categories = useStore((s) => s.categories);
  const setTaskDetails = useStore((s) => s.setTaskDetails);
  const catOf = categoryMap(categories);
  const [open, setOpen] = useState<string | null>(null);

  const pending = tasks.filter((t) => t.status === 'pending');
  if (pending.length === 0) return null;

  return (
    <Card>
      <SectionLabel>Notes &amp; details</SectionLabel>
      <div className="mt-3 space-y-1.5">
        {pending.map((t) => {
          const cat = catOf(t.category);
          const isOpen = open === t.id;
          const hasNote = !!t.details?.trim();
          return (
            <div key={t.id} className="overflow-hidden rounded-xl border border-stone-200">
              <button
                onClick={() => setOpen(isOpen ? null : t.id)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition hover:bg-stone-50"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cat.color }} />
                <span className="flex-1 truncate text-stone-800">{t.title}</span>
                {hasNote && !isOpen && (
                  <span className="truncate text-xs text-stone-400" style={{ maxWidth: '40%' }}>
                    {t.details}
                  </span>
                )}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-3 pb-3">
                  <textarea
                    autoFocus
                    value={t.details ?? ''}
                    onChange={(e) => setTaskDetails(t.id, e.target.value)}
                    placeholder="Add details, links, instructions, or anything to remember…"
                    rows={3}
                    className="w-full resize-y rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
