import type { CategoryDef, Prefs, ScheduleBlock, ScheduleResult, Task } from '../types';
import { daysUntil } from './time';

/**
 * Compare two tasks for scheduling priority (negative → `a` first). Strictly
 * lexicographic:
 *   1. Category rank (the per-category stars set in Settings), highest first.
 *   2. Task importance (the stars set when adding the task), highest first —
 *      this only differentiates tasks within the same category.
 *   3. Earliest due date, as a final tiebreak.
 */
export function compareTasks(
  a: Task,
  b: Task,
  weightOf: Record<string, number>,
  now: Date,
): number {
  const catA = weightOf[a.category] ?? 3;
  const catB = weightOf[b.category] ?? 3;
  return (
    catB - catA ||
    b.importance - a.importance ||
    daysUntil(a.dueISO, now) - daysUntil(b.dueISO, now)
  );
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
    .map((t) => ({ t }))
    .sort((a, b) => compareTasks(a.t, b.t, weightOf, now));

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

  // 3) Fill gaps with flexible tasks in priority order. Tasks are split across
  //    "sections" (work blocks between breaks) when they don't fit, and breaks
  //    start early once work is within ±TOL of the cadence.
  const cadence = prefs.breakCadence;
  const breakLen = prefs.breakMinutes;
  const TOL = 15;
  const queue = flexible.map((f) => ({ task: f.t, remaining: f.t.estMinutes }));
  let qi = 0; // index of the first not-yet-finished task

  for (const [s, e] of gaps) {
    let c = s;
    let segWork = 0; // work done since the last break in this gap
    while (qi < queue.length && c < e) {
      // Start a break early once we're within ±TOL of the cadence target.
      if (segWork >= cadence - TOL) {
        const breakEnd = Math.min(c + breakLen, e);
        blocks.push({ id: blockId(), kind: 'break', title: 'Break', startMin: c, endMin: breakEnd });
        c = breakEnd;
        segWork = 0;
        continue;
      }
      const item = queue[qi];
      const remToTarget = cadence - segWork;
      // Finish the task here if it lands within TOL of the target; otherwise fill
      // up to the target and carry the remainder into the next section (split).
      const wholeFits = item.remaining <= remToTarget + TOL;
      let chunk = wholeFits ? item.remaining : remToTarget;
      chunk = Math.min(chunk, e - c);
      if (chunk <= 0) break; // no room left in this gap
      blocks.push({
        id: blockId(),
        kind: 'task',
        taskId: item.task.id,
        title: item.task.title,
        category: item.task.category,
        startMin: c,
        endMin: c + chunk,
      });
      c += chunk;
      segWork += chunk;
      item.remaining -= chunk;
      if (item.remaining <= 0) qi++;
    }
  }
  // Anything not fully placed overflows.
  for (let i = qi; i < queue.length; i++) {
    if (queue[i].remaining > 0) overflow.push(queue[i].task);
  }

  // Tag split tasks with part info (kept off the title so the UI can style it).
  const counts: Record<string, number> = {};
  for (const b of blocks) if (b.kind === 'task' && b.taskId && !b.fixed) counts[b.taskId] = (counts[b.taskId] || 0) + 1;
  const seen: Record<string, number> = {};
  for (const b of blocks) {
    if (b.kind === 'task' && b.taskId && !b.fixed && counts[b.taskId] > 1) {
      seen[b.taskId] = (seen[b.taskId] || 0) + 1;
      b.part = { index: seen[b.taskId], total: counts[b.taskId] };
    }
  }

  blocks.sort((a, b) => a.startMin - b.startMin);
  return { blocks, overflow, fits: overflow.length === 0, endLimitMin };
}

/** Total minutes of actual task work in a schedule (excludes breaks). */
export function totalWorkMinutes(result: ScheduleResult): number {
  return result.blocks
    .filter((b) => b.kind === 'task')
    .reduce((sum, b) => sum + (b.endMin - b.startMin), 0);
}
