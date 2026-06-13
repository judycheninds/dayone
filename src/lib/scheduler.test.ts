import { describe, expect, it } from 'vitest';
import { buildSchedule, scoreTask } from './scheduler';
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

describe('scoreTask', () => {
  it('ranks a test due tomorrow above chores due next week', () => {
    const test = task({
      category: 'study-test',
      importance: 5,
      dueISO: new Date('2026-06-14T23:59:00').toISOString(),
    });
    const chore = task({
      category: 'chores',
      importance: 1,
      dueISO: new Date('2026-06-20T23:59:00').toISOString(),
    });
    expect(scoreTask(test, WEIGHTS, NOW)).toBeGreaterThan(scoreTask(chore, WEIGHTS, NOW));
  });

  it('weights nearer due dates higher, all else equal', () => {
    const soon = task({ dueISO: new Date('2026-06-13T23:59:00').toISOString() });
    const later = task({ dueISO: new Date('2026-06-27T23:59:00').toISOString() });
    expect(scoreTask(soon, WEIGHTS, NOW)).toBeGreaterThan(scoreTask(later, WEIGHTS, NOW));
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

  it('inserts a break after the cadence is exceeded', () => {
    const prefs = { ...DEFAULT_PREFS, breakCadence: 60 as const };
    const tasks = [task({ title: 'a', estMinutes: 45 }), task({ title: 'b', estMinutes: 45 })];
    const r = build(tasks, prefs);
    const tasks3 = [...tasks, task({ title: 'c', estMinutes: 30 })];
    const r3 = build(tasks3, prefs);
    expect(r.blocks.some((b) => b.kind === 'break')).toBe(false);
    expect(r3.blocks.some((b) => b.kind === 'break')).toBe(true);
  });

  it('overflows tasks that cannot fit before bedtime', () => {
    const tasks = [task({ title: 'big', estMinutes: 400 }), task({ title: 'huge', estMinutes: 400 })];
    const r = build(tasks);
    expect(r.fits).toBe(false);
    expect(r.overflow.length).toBe(1);
    expect(r.blocks.filter((b) => b.kind === 'task').length).toBe(1);
  });

  it('keeps a smaller task that still fits after a big one overflows', () => {
    const tasks = [
      task({ title: 'big', category: 'study-test', importance: 5, estMinutes: 400 }),
      task({ title: 'tiny', category: 'study-test', importance: 5, estMinutes: 20 }),
    ];
    const r = build(tasks);
    const titles = r.blocks.filter((b) => b.kind === 'task').map((b) => b.title);
    expect(titles).toContain('big');
    expect(titles).toContain('tiny');
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

  it('respects a custom category weight', () => {
    const cats = DEFAULT_CATEGORIES.map((c) => (c.id === 'chores' ? { ...c, weight: 10 } : c));
    const chore = task({ title: 'chore', category: 'chores', importance: 1 });
    const hw = task({ title: 'hw', category: 'homework', importance: 1 });
    const r = buildSchedule([hw, chore], DEFAULT_PREFS, cats, NOW_MIN, NOW);
    expect(r.blocks.find((b) => b.kind === 'task')?.title).toBe('chore');
  });
});
