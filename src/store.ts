import { create } from 'zustand';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PREFS,
  type CategoryDef,
  type Importance,
  type Prefs,
  type ScheduleResult,
  type Task,
} from './types';
import { buildSchedule } from './lib/scheduler';
import { minutesOfDay } from './lib/time';
import {
  getSession,
  loadUserData,
  loginLocal as loginLocalDb,
  registerLocal,
  saveUserData,
  setSession,
} from './lib/localdb';

export type View = 'plan' | 'run';

/** A frozen schedule for run mode, anchored to a wall-clock moment. */
export interface RunSnapshot extends ScheduleResult {
  anchorMin: number;
  anchorMs: number;
}

export function snapshotNowMin(snap: RunSnapshot, now: Date): number {
  return snap.anchorMin + (now.getTime() - snap.anchorMs) / 60000;
}

export function activeIndex(snap: RunSnapshot, now: Date): number {
  const nm = snapshotNowMin(snap, now);
  return snap.blocks.findIndex((b) => b.endMin > nm);
}

interface Account {
  name: string;
  email: string;
}

interface NewTaskInput {
  title: string;
  category: Task['category'];
  importance: Importance;
  dueISO: string;
  estMinutes: number;
  reward?: string;
}

interface State {
  account: Account | null;
  cloudUserId: string | null;
  prefs: Prefs;
  tasks: Task[];
  categories: CategoryDef[];
  view: View;
  startMin: number;
  running: boolean;
  runSnapshot: RunSnapshot | null;

  // auth (local, guest mode)
  signupLocal: (username: string, email: string, password: string, prefs: Prefs) => Promise<void>;
  loginLocal: (username: string, password: string) => Promise<void>;
  bootstrap: () => void;
  signOut: () => void;

  // account / prefs (cloud mode helpers)
  createAccount: (a: Account, prefs: Prefs) => void;
  hydrate: (
    s: { name: string; prefs: Prefs; tasks: Task[]; startMin: number; categories?: CategoryDef[] },
    cloudUserId: string,
    email: string,
  ) => void;
  setCloudUserId: (id: string | null) => void;
  updatePrefs: (p: Partial<Prefs>) => void;
  setStartMin: (m: number) => void;

  // categories
  addCategory: (label: string, color: string) => void;
  updateCategory: (id: string, patch: Partial<CategoryDef>) => void;
  removeCategory: (id: string) => void;

  // tasks
  addTask: (t: NewTaskInput) => void;
  removeTask: (id: string) => void;
  completeTask: (id: string, actualMinutes?: number) => void;
  addTimeToTask: (id: string, minutes: number) => void;
  clearCompleted: () => void;
  /** Mark a task's reward as granted by the parent. */
  claimReward: (id: string, claimed: boolean) => void;

  // run
  startDay: () => void;
  stopDay: () => void;
  setView: (v: View) => void;
  reflowExtend: (min: number) => void;
  reflowFinish: () => void;

  // derived
  schedule: (now?: Date) => ScheduleResult;
}

function rebuildSnapshot(
  tasks: Task[],
  prefs: Prefs,
  categories: CategoryDef[],
  now: Date,
): RunSnapshot {
  const anchorMin = minutesOfDay(now);
  const res = buildSchedule(tasks, prefs, categories, anchorMin, now);
  return { ...res, anchorMin, anchorMs: now.getTime() };
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const loggedOut = {
  account: null,
  cloudUserId: null,
  tasks: [],
  running: false,
  view: 'plan' as View,
  runSnapshot: null,
};

export const useStore = create<State>()((set, get) => ({
  account: null,
  cloudUserId: null,
  prefs: DEFAULT_PREFS,
  tasks: [],
  categories: DEFAULT_CATEGORIES,
  view: 'plan',
  startMin: minutesOfDay(new Date()),
  running: false,
  runSnapshot: null,

  signupLocal: async (username, email, password, prefs) => {
    const startMin = minutesOfDay(new Date());
    const categories = DEFAULT_CATEGORIES;
    await registerLocal(username, email, password, {
      name: username,
      email,
      prefs,
      tasks: [],
      startMin,
      categories,
    });
    set({ ...loggedOut, account: { name: username, email }, prefs, categories, startMin });
  },

  loginLocal: async (username, password) => {
    const snap = await loginLocalDb(username, password);
    set({
      ...loggedOut,
      account: { name: snap.name, email: snap.email },
      prefs: snap.prefs,
      tasks: snap.tasks,
      categories: snap.categories?.length ? snap.categories : DEFAULT_CATEGORIES,
      startMin: snap.startMin,
    });
  },

  bootstrap: () => {
    const u = getSession();
    if (!u) return;
    const snap = loadUserData(u);
    if (!snap) return;
    set({
      account: { name: snap.name, email: snap.email },
      prefs: snap.prefs,
      tasks: snap.tasks,
      categories: snap.categories?.length ? snap.categories : DEFAULT_CATEGORIES,
      startMin: snap.startMin,
    });
  },

  signOut: () => {
    setSession(null);
    set({ ...loggedOut, prefs: DEFAULT_PREFS, categories: DEFAULT_CATEGORIES });
  },

  createAccount: (account, prefs) => set({ account, prefs }),
  hydrate: (snap, cloudUserId, email) =>
    set({
      cloudUserId,
      account: { name: snap.name, email },
      prefs: snap.prefs,
      tasks: snap.tasks,
      startMin: snap.startMin,
      categories: snap.categories?.length ? snap.categories : DEFAULT_CATEGORIES,
    }),
  setCloudUserId: (cloudUserId) => set({ cloudUserId }),
  updatePrefs: (p) => set((s) => ({ prefs: { ...s.prefs, ...p } })),
  setStartMin: (startMin) => set({ startMin }),

  addCategory: (label, color) =>
    set((s) => ({
      categories: [
        ...s.categories,
        { id: `c-${uid()}`, label: label.trim() || 'New category', color, weight: 5 },
      ],
    })),
  updateCategory: (id, patch) =>
    set((s) => ({
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  removeCategory: (id) =>
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id || c.builtin) })),

  addTask: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: uid(), status: 'pending' }] })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  completeTask: (id, actualMinutes) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: 'done', actualMinutes } : t)),
    })),
  addTimeToTask: (id, minutes) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, estMinutes: t.estMinutes + minutes } : t)),
    })),
  clearCompleted: () => set((s) => ({ tasks: s.tasks.filter((t) => t.status !== 'done') })),
  claimReward: (id, claimed) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, rewardClaimed: claimed } : t)),
    })),

  startDay: () => {
    const s = get();
    set({
      running: true,
      view: 'run',
      startMin: minutesOfDay(new Date()),
      runSnapshot: rebuildSnapshot(s.tasks, s.prefs, s.categories, new Date()),
    });
  },
  stopDay: () => set({ running: false, view: 'plan', runSnapshot: null }),
  setView: (view) => set({ view }),

  reflowExtend: (min) => {
    const s = get();
    const snap = s.runSnapshot;
    if (!snap) return;
    const now = new Date();
    const idx = activeIndex(snap, now);
    if (idx < 0) return;
    const active = snap.blocks[idx];
    const blocks = snap.blocks.map((b, i) => {
      if (i < idx) return b;
      if (i === idx) return { ...b, endMin: b.endMin + min };
      return { ...b, startMin: b.startMin + min, endMin: b.endMin + min };
    });
    const tasks =
      active.kind === 'task' && active.taskId
        ? s.tasks.map((t) => (t.id === active.taskId ? { ...t, estMinutes: t.estMinutes + min } : t))
        : s.tasks;
    const last = blocks[blocks.length - 1];
    set({
      tasks,
      runSnapshot: { ...snap, blocks, fits: last ? last.endMin <= snap.endLimitMin : true },
    });
  },

  reflowFinish: () => {
    const s = get();
    const snap = s.runSnapshot;
    if (!snap) return;
    const now = new Date();
    const idx = activeIndex(snap, now);
    let tasks = s.tasks;
    if (idx >= 0) {
      const active = snap.blocks[idx];
      if (active.kind === 'task' && active.taskId) {
        const elapsed = Math.max(1, Math.round(snapshotNowMin(snap, now) - active.startMin));
        tasks = s.tasks.map((t) =>
          t.id === active.taskId ? { ...t, status: 'done', actualMinutes: elapsed } : t,
        );
      }
    }
    set({ tasks, runSnapshot: rebuildSnapshot(tasks, s.prefs, s.categories, now) });
  },

  schedule: (now = new Date()) => {
    const s = get();
    return buildSchedule(s.tasks, s.prefs, s.categories, s.startMin, now);
  },
}));

// Per-user local persistence: save the current user's data whenever it changes.
useStore.subscribe((s) => {
  const u = getSession();
  if (u && s.account) {
    saveUserData(u, {
      name: s.account.name,
      email: s.account.email,
      prefs: s.prefs,
      tasks: s.tasks,
      startMin: s.startMin,
      categories: s.categories,
    });
  }
});
