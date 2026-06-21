import { describe, expect, it } from 'vitest';
import { buildSchedule, compareTasks } from './scheduler';
import { DEFAULT_CATEGORIES, DEFAULT_PREFS, type Task } from '../types';

const NOW = new Date('2026-06-13T15:00:00'); // 3:00 PM
const NOW_MIN = 15 * 60;
const WEIGHTS = Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.id, c.weight]));

function task(over: Partial<Task>): Task {
  return {
    id: Math.random().toString(36).slice(2),
    title: 'task',
    category: 'homework',
    importance: 3,
    dueISO: new Date('2026-06-20T23:59:00').toISOString(),
    estMinutes: 30,
    status: 'pending',
    ...over,
  };
}

const build = (tasks: Task[], prefs = DEFAULT_PREFS, nowMin = NOW_MIN) =>
  buildSchedule(tasks, prefs, DEFAULT_CATEGORIES, nowMin, NOW);

describe('compareTasks', () => {
  it('ranks by category first, regardless of task stars', () => {
    // A 3-star test outranks a 5-star quiz because the test category ranks higher.
    const test = task({ category: 'study-test', importance: 3 });
    const quiz = task({ category: 'study-quiz', importance: 5 });
    expect(compareTasks(test, quiz, WEIGHTS, NOW)).toBeLessThan(0); // test first
  });

  it('uses task stars to break ties within the same category', () => {
    const quizHi = task({ category: 'study-quiz', importance: 5 });
    const quizLo = task({ category: 'study-quiz', importance: 3 });
    expect(compareTasks(quizHi, quizLo, WEIGHTS, NOW)).toBeLessThan(0); // 5★ first
  });

  it("matches the user's example order: test, then 5★ quiz, then 3★ quiz", () => {
    const test = task({ title: 'test', category: 'study-test', importance: 3 });
    const quiz5 = task({ title: 'quiz5', category: 'study-quiz', importance: 5 });
    const quiz3 = task({ title: 'quiz3', category: 'study-quiz', importance: 3 });
    const order = [quiz3, quiz5, test].sort((a, b) => compareTasks(a, b, WEIGHTS, NOW)).map((t) => t.title);
    expect(order).toEqual(['test', 'quiz5', 'quiz3']);
  });

  it('falls back to earliest due date when category and stars tie', () => {
    const soon = task({ dueISO: new Date('2026-06-14T23:59:00').toISOString() });
    const later = task({ dueISO: new Date('2026-06-27T23:59:00').toISOString() });
    expect(compareTasks(soon, later, WEIGHTS, NOW)).toBeLessThan(0);
  });
});

describe('buildSchedule', () => {
  it('places higher-priority tasks first', () => {
    const urgent = task({ title: 'urgent', category: 'study-test', importance: 5, dueISO: new Date('2026-06-14T23:59:00').toISOString() });
    const lazy = task({ title: 'lazy', category: 'chores', importance: 1 });
    const r = build([lazy, urgent]);
    const firstTask = r.blocks.find((b) => b.kind === 'task');
    expect(firstTask?.title).toBe('urgent');
  });

  it('starts a break once work is within ±15 of the cadence', () => {
    // cadence 60: a 45-min task (= cadence−15) triggers a break before the next task
    const tasks = [task({ title: 'a', estMinutes: 45 }), task({ title: 'b', estMinutes: 45 })];
    const r = build(tasks);
    const idxA = r.blocks.findIndex((b) => b.title === 'a');
    const idxBreak = r.blocks.findIndex((b) => b.kind === 'break');
    const idxB = r.blocks.findIndex((b) => b.title === 'b');
    expect(idxBreak).toBeGreaterThan(idxA);
    expect(idxB).toBeGreaterThan(idxBreak);
  });

  it('splits a task that exceeds a section across breaks', () => {
    const tasks = [task({ title: 'long', estMinutes: 130 })]; // cadence 60
    const r = build(tasks);
    const parts = r.blocks.filter((b) => b.kind === 'task' && b.title === 'long');
    expect(parts.length).toBeGreaterThan(1);
    const total = parts.reduce((sum, b) => sum + (b.endMin - b.startMin), 0);
    expect(total).toBe(130);
    expect(parts[0].part).toEqual({ index: 1, total: parts.length });
    expect(r.blocks.some((b) => b.kind === 'break')).toBe(true);
  });

  it('overflows tasks that cannot fit before bedtime', () => {
    const r = build([task({ title: 'huge', estMinutes: 2000 })]);
    expect(r.fits).toBe(false);
    expect(r.overflow.length).toBeGreaterThan(0);
  });

  it('handles a bedtime past midnight', () => {
    const prefs = { ...DEFAULT_PREFS, sleepMin: 1 * 60 }; // 1:00 AM
    const r = build([task({ estMinutes: 60 })], prefs);
    expect(r.endLimitMin).toBeGreaterThan(NOW_MIN);
    expect(r.fits).toBe(true);
  });

  it('reflow: re-running with later nowMin shifts the schedule', () => {
    const tasks = [task({ title: 'a', estMinutes: 60 })];
    const first = build(tasks);
    const reflowed = build(tasks, DEFAULT_PREFS, NOW_MIN + 30);
    const a1 = first.blocks.find((b) => b.title === 'a')!;
    const a2 = reflowed.blocks.find((b) => b.title === 'a')!;
    expect(a2.startMin).toBe(a1.startMin + 30);
  });

  it('pins a fixed-time task to its slot and fills flexible tasks around it', () => {
    const fixed = task({ title: 'piano', fixedStartMin: 18 * 60, estMinutes: 60 }); // 6–7pm
    const flex = task({ title: 'reading', estMinutes: 30 });
    const r = build([flex, fixed]); // now = 3pm
    const pinned = r.blocks.find((b) => b.title === 'piano')!;
    expect(pinned.startMin).toBe(18 * 60);
    expect(pinned.endMin).toBe(19 * 60);
    expect(pinned.fixed).toBe(true);
    // flexible reading is placed before the pinned slot (it fits in the 3pm–6pm gap)
    const reading = r.blocks.find((b) => b.title === 'reading')!;
    expect(reading.endMin).toBeLessThanOrEqual(18 * 60);
  });

  it('respects a custom category weight', () => {
    const cats = DEFAULT_CATEGORIES.map((c) => (c.id === 'chores' ? { ...c, weight: 10 } : c));
    const chore = task({ title: 'chore', category: 'chores', importance: 1 });
    const hw = task({ title: 'hw', category: 'homework', importance: 1 });
    const r = buildSchedule([hw, chore], DEFAULT_PREFS, cats, NOW_MIN, NOW);
    expect(r.blocks.find((b) => b.kind === 'task')?.title).toBe('chore');
  });
});
