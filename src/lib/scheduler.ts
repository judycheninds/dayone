import type { CategoryDef, Prefs, ScheduleBlock, ScheduleResult, Task } from '../types';
import { daysUntil } from './time';

/**
 * Priority score for a task (higher = do sooner).
 * Combines three 0–10 sub-scores: due-date urgency, category weight, user importance.
 * Pure: urgency is computed against the passed-in `now`, never Date.now().
 */
export function scoreTask(
  task: Task,
  weightOf: Record<string, number>,
  now: Date,
): number {
  const d = daysUntil(task.dueISO, now);
  // Urgency: overdue/today ≈ 10, a week out ≈ 1.25, decays smoothly.
  const urgency = clamp(10 / (1 + Math.max(d, 0)), 0, 10);
  const category = clamp(weightOf[task.category] ?? 5, 0, 10);
  const importance = clamp(task.importance * 2, 0, 10);
  return urgency + category + importance;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

let blockSeq = 0;
function blockId(): string {
  blockSeq += 1;
  return `b${blockSeq}`;
}

/**
 * Build an optimized, time-blocked schedule from `nowMin` until (sleep − windDown).
 * Pure function: same inputs → same output (also powers reflow).
 */
export function buildSchedule(
  tasks: Task[],
  prefs: Prefs,
  categories: CategoryDef[],
  nowMin: number,
  now: Date,
): ScheduleResult {
  const weightOf: Record<string, number> = {};
  for (const c of categories) weightOf[c.id] = c.weight;

  // Sleep may be past midnight relative to "now" (e.g. plan at 5pm, sleep 1am).
  let sleepMin = prefs.sleepMin;
  if (sleepMin <= nowMin) sleepMin += 1440;
  const endLimitMin = sleepMin - prefs.windDownMin;

  const pending = tasks.filter((t) => t.status === 'pending');

  // Fixed-time tasks are pinned to their slots; flexible tasks fill the gaps.
  const fixed = pending
    .filter((t) => t.fixedStartMin != null)
    .map((t) => ({ t, start: t.fixedStartMin!, end: t.fixedStartMin! + t.estMinutes }))
    .sort((a, b) => a.start - b.start);

  const flexible = pending
    .filter((t) => t.fixedStartMin == null)
    .map((t) => ({ t, score: scoreTask(t, weightOf, now) }))
    .sort((a, b) => b.score - a.score || daysUntil(a.t.dueISO, now) - daysUntil(b.t.dueISO, now));

  const blocks: ScheduleBlock[] = [];
  const overflow: Task[] = [];

  // 1) Place all pinned tasks at their exact times.
  for (const f of fixed) {
    blocks.push({
      id: blockId(),
      kind: 'task',
      taskId: f.t.id,
      title: f.t.title,
      category: f.t.category,
      startMin: f.start,
      endMin: f.end,
      fixed: true,
    });
  }

  // 2) Compute free gaps between now and the bedtime limit, minus pinned slots.
  const occupied = fixed
    .map((f) => [Math.max(f.start, nowMin), f.end] as [number, number])
    .filter(([s, e]) => e > nowMin && s < endLimitMin)
    .sort((a, b) => a[0] - b[0]);

  const gaps: [number, number][] = [];
  let cursor = nowMin;
  for (const [s, e] of occupied) {
    if (s > cursor) gaps.push([cursor, Math.min(s, endLimitMin)]);
    cursor = Math.max(cursor, e);
  }
  if (cursor < endLimitMin) gaps.push([cursor, endLimitMin]);

  // 3) Fill gaps with flexible tasks in priority order, inserting breaks per cadence.
  const placed = new Set<string>();
  for (const [s, e] of gaps) {
    let c = s;
    let workSinceBreak = 0;
    for (const { t } of flexible) {
      if (placed.has(t.id)) continue;
      if (workSinceBreak >= prefs.breakCadence) {
        const breakEnd = Math.min(c + prefs.breakMinutes, e);
        if (breakEnd > c) {
          blocks.push({ id: blockId(), kind: 'break', title: 'Break', startMin: c, endMin: breakEnd });
          c = breakEnd;
          workSinceBreak = 0;
        } else break; // gap is full
      }
      if (c + t.estMinutes <= e) {
        blocks.push({
          id: blockId(),
          kind: 'task',
          taskId: t.id,
          title: t.title,
          category: t.category,
          startMin: c,
          endMin: c + t.estMinutes,
        });
        c += t.estMinutes;
        workSinceBreak += t.estMinutes;
        placed.add(t.id);
      }
    }
  }
  for (const { t } of flexible) if (!placed.has(t.id)) overflow.push(t);

  blocks.sort((a, b) => a.startMin - b.startMin);
  return { blocks, overflow, fits: overflow.length === 0, endLimitMin };
}

/** Total minutes of actual task work in a schedule (excludes breaks). */
export function totalWorkMinutes(result: ScheduleResult): number {
  return result.blocks
    .filter((b) => b.kind === 'task')
    .reduce((sum, b) => sum + (b.endMin - b.startMin), 0);
}
