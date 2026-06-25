import { useStore } from '../store';
import { categoryMap } from '../types';
import { dueLabel } from '../lib/dueDate';
import { fmtDur } from '../lib/time';
import { Card, SectionLabel } from './ui';

/** Non-urgent tasks that didn't fit today — saved on the account for later. */
export function SavedForLater() {
  const schedule = useStore((s) => s.schedule);
  const categories = useStore((s) => s.categories);
  const catOf = categoryMap(categories);

  const now = new Date();
  const deferred = schedule(now).deferred;
  if (deferred.length === 0) return null;

  return (
    <Card>
      <SectionLabel>Saved for later</SectionLabel>
      <p className="mt-1 text-xs text-stone-500">
        Not due yet and no room today — saved to your account. They'll slot in automatically
        when there's free time.
      </p>
      <ul className="mt-3 space-y-1.5">
        {deferred.map((t) => {
          const cat = catOf(t.category);
          return (
            <li
              key={t.id}
              className="flex items-center gap-2.5 rounded-xl border border-stone-200 px-3 py-2 text-sm"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cat.color }} />
              <span className="flex-1 truncate text-stone-700">{t.title}</span>
              <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-500">
                {dueLabel(t.dueISO, now)}
              </span>
              <span className="text-[11px] tabular-nums text-stone-500">{fmtDur(t.estMinutes)}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
