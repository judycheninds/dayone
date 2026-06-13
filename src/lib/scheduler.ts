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

  const pending = tasks
    .filter((t) => t.status === 'pending')
    .map((t) => ({ t, score: scoreTask(t, weightOf, now) }))
    .sort((a, b) => b.score - a.score || daysUntil(a.t.dueISO, now) - daysUntil(b.t.dueISO, now));

  const blocks: ScheduleBlock[] = [];
  const overflow: Task[] = [];
  let cursor = nowMin;
  let workSinceBreak = 0;

  for (let i = 0; i < pending.length; i++) {
    const task = pending[i].t;

    // Insert a break if we've worked past the cadence and more work remains.
    if (workSinceBreak >= prefs.breakCadence) {
      const breakEnd = Math.min(cursor + prefs.breakMinutes, endLimitMin);
      if (breakEnd > cursor) {
        blocks.push({
          id: blockId(),
          kind: 'break',
          title: 'Break',
          startMin: cursor,
          endMin: breakEnd,
        });
        cursor = breakEnd;
      }
      workSinceBreak = 0;
    }

    const taskEnd = cursor + task.estMinutes;
    if (taskEnd > endLimitMin) {
      overflow.push(task);
      continue; // a later, smaller task might still fit
    }

    blocks.push({
      id: blockId(),
      kind: 'task',
      taskId: task.id,
      title: task.title,
      category: task.category,
      startMin: cursor,
      endMin: taskEnd,
    });
    cursor = taskEnd;
    workSinceBreak += task.estMinutes;
  }

  return { blocks, overflow, fits: overflow.length === 0, endLimitMin };
}

/** Total minutes of actual task work in a schedule (excludes breaks). */
export function totalWorkMinutes(result: ScheduleResult): number {
  return result.blocks
    .filter((b) => b.kind === 'task')
    .reduce((sum, b) => sum + (b.endMin - b.startMin), 0);
}
