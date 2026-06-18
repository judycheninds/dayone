/** A category id is just a string so users can add their own. */
export type Category = string;

export interface CategoryDef {
  id: string;
  label: string;
  color: string;
  /** Priority weight 0–10 used by the scheduler. */
  weight: number;
  /** Built-in categories can't be deleted. */
  builtin?: boolean;
}

// Priority weight is a 1–5 (star) scale, matching task importance.
export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: 'study-test', label: 'Studying — Test', color: '#e5484d', weight: 5, builtin: true },
  { id: 'study-quiz', label: 'Studying — Quiz', color: '#f76808', weight: 4, builtin: true },
  { id: 'homework', label: 'Homework', color: '#3e63dd', weight: 3, builtin: true },
  { id: 'classes', label: 'Classes', color: '#8e4ec6', weight: 3, builtin: true },
  { id: 'work', label: 'Work', color: '#30a46c', weight: 2, builtin: true },
  { id: 'chores', label: 'Chores', color: '#80838d', weight: 1, builtin: true },
];

/** Fallback definition for a task whose category was deleted. */
export const FALLBACK_CATEGORY: CategoryDef = {
  id: '__none',
  label: 'Uncategorized',
  color: '#94a3b8',
  weight: 3,
};

/** Normalize a category weight to the 1–5 scale (migrates old 0–10 data). */
export function normalizeWeight(w: number): number {
  return w > 5 ? Math.max(1, Math.round(w / 2)) : Math.max(1, Math.min(5, Math.round(w)));
}

export type Importance = 1 | 2 | 3 | 4 | 5;
export type TaskStatus = 'pending' | 'done';

export interface Task {
  id: string;
  title: string;
  category: Category;
  importance: Importance; // user-set, 1 (low) – 5 (high)
  dueISO: string; // ISO date string for end-of-due-day
  estMinutes: number; // expected duration
  status: TaskStatus;
  actualMinutes?: number; // filled in once completed / overrun
  /** If set, the task is pinned to this start time (minutes since midnight). */
  fixedStartMin?: number;
  /** Free-form notes / details for the task. */
  details?: string;
  /** Optional reward a parent agreed to give for finishing this task. */
  reward?: string;
  /** True once the parent has actually granted the reward. */
  rewardClaimed?: boolean;
}

export interface Prefs {
  /** Target bedtime as minutes since midnight (e.g. 23:00 -> 1380). */
  sleepMin: number;
  /** No tasks scheduled within this many minutes before sleep. */
  windDownMin: number;
  /** Insert a break after this many minutes of cumulative work. */
  breakCadence: 60 | 90;
  /** Length of an inserted break. */
  breakMinutes: number;
  /** Parent / guardian contact for reward notifications. */
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
}

export type BlockKind = 'task' | 'break';

export interface ScheduleBlock {
  id: string;
  kind: BlockKind;
  taskId?: string;
  title: string;
  category?: Category;
  startMin: number; // minutes since midnight
  endMin: number;
  /** True for a task pinned to a specific time slot. */
  fixed?: boolean;
}

export interface ScheduleResult {
  blocks: ScheduleBlock[];
  /** Tasks that could not be fit before (sleep − windDown). */
  overflow: Task[];
  fits: boolean;
  /** Last usable minute of the day for tasks. */
  endLimitMin: number;
}

export const DEFAULT_PREFS: Prefs = {
  sleepMin: 23 * 60,
  windDownMin: 30,
  breakCadence: 60,
  breakMinutes: 10,
};

/** Map of category id → definition, with fallback for unknown ids. */
export function categoryMap(cats: CategoryDef[]): (id?: string) => CategoryDef {
  const m = new Map(cats.map((c) => [c.id, c]));
  return (id) => (id && m.get(id)) || FALLBACK_CATEGORY;
}
