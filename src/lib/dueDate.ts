import { DAY_MS } from './time';

export type DuePreset = 'today' | 'tomorrow' | 'in3' | 'nextweek' | 'date';

export const DUE_PRESETS: { id: DuePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'in3', label: 'In 3 days' },
  { id: 'nextweek', label: 'Next week' },
  { id: 'date', label: 'Pick a date' },
];

/** End of the given local day (23:59) as an ISO string. */
function endOfDayISO(d: Date): string {
  const e = new Date(d);
  e.setHours(23, 59, 0, 0);
  return e.toISOString();
}

/** Resolve a preset (and optional explicit date) into an ISO due timestamp. */
export function resolveDue(preset: DuePreset, now: Date, explicit?: string): string {
  if (preset === 'date' && explicit) {
    // explicit is a yyyy-mm-dd from <input type=date>
    const [y, m, day] = explicit.split('-').map(Number);
    return endOfDayISO(new Date(y, m - 1, day));
  }
  const base = now.getTime();
  const add = (days: number) => endOfDayISO(new Date(base + days * DAY_MS));
  switch (preset) {
    case 'today':
      return endOfDayISO(now);
    case 'tomorrow':
      return add(1);
    case 'in3':
      return add(3);
    case 'nextweek':
      return add(7);
    default:
      return endOfDayISO(now);
  }
}

/** Human label for a due date relative to now ("Today", "Tomorrow", "in 4 days", "Overdue"). */
export function dueLabel(dueISO: string, now: Date): string {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const due = new Date(dueISO);
  const dueStart = new Date(due);
  dueStart.setHours(0, 0, 0, 0);
  const diff = Math.round((dueStart.getTime() - startOfToday.getTime()) / DAY_MS);
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 7) return `in ${diff} days`;
  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
