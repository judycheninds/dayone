/** Time + date helpers. Pure functions — easy to test. */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Minutes since midnight for a given Date (local time). */
export function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Format minutes-since-midnight (may exceed 1440 for after-midnight) as "h:mm AM/PM". */
export function fmtMin(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  let h = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mm.toString().padStart(2, '0')} ${ampm}`;
}

/** Format a duration in minutes as "1h 20m" / "45m". */
export function fmtDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/** Parse an "HH:MM" string into minutes since midnight. */
export function parseHHMM(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Convert minutes since midnight back to "HH:MM" for <input type=time>. */
export function toHHMM(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${h.toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
}

/**
 * Parse a freely-typed time into minutes since midnight, or null if invalid.
 * Accepts "3:30 PM", "3pm", "15:00", "9", "9:05am", etc.
 */
export function parseFlexibleTime(s: string): number | null {
  const str = s.trim().toLowerCase().replace(/\s+/g, ' ');
  const m = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3];
  if (min > 59) return null;
  if (ap) {
    if (h < 1 || h > 12) return null;
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
  } else if (h > 23) {
    return null;
  }
  return (h * 60 + min) % 1440;
}

/** Whole days until a due date, relative to `now`. Can be negative (overdue). */
export function daysUntil(dueISO: string, now: Date): number {
  const due = new Date(dueISO).getTime();
  return (due - now.getTime()) / DAY_MS;
}

/** Local yyyy-mm-dd key for a date. */
export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Whole-calendar-day difference between a due date and `now` (today=0, tomorrow=1, overdue<0). */
export function calDayDiff(dueISO: string, now: Date): number {
  const due = new Date(dueISO);
  due.setHours(0, 0, 0, 0);
  const n = new Date(now);
  n.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - n.getTime()) / DAY_MS);
}
