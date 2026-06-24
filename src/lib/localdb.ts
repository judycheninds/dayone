/**
 * Local-first accounts for guest mode (no backend). Credentials are stored in
 * localStorage with SHA-256–hashed passwords, and each user's data lives in its
 * own namespaced key. This is demo-grade auth — fine for a client-only app, not
 * a substitute for a real server.
 */
import { DEFAULT_CATEGORIES, DEFAULT_PREFS, type CategoryDef, type Prefs, type Task } from '../types';

const USERS_KEY = 'dayone-users';
const SESSION_KEY = 'dayone-session';
const dataKey = (username: string) => `dayone-user-${username.toLowerCase()}`;

export interface UserSnapshot {
  name: string;
  email: string;
  prefs: Prefs;
  tasks: Task[];
  startMin: number;
  categories: CategoryDef[];
}

interface StoredUser {
  email: string;
  passHash: string;
}

type Users = Record<string, StoredUser>; // keyed by lowercased username

function loadUsers(): Users {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
}
function saveUsers(u: Users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

export async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}
export function setSession(username: string | null) {
  if (username) localStorage.setItem(SESSION_KEY, username);
  else localStorage.removeItem(SESSION_KEY);
}

export function loadUserData(username: string): UserSnapshot | null {
  try {
    const raw = localStorage.getItem(dataKey(username));
    return raw ? (JSON.parse(raw) as UserSnapshot) : null;
  } catch {
    return null;
  }
}
export function saveUserData(username: string, snap: UserSnapshot) {
  localStorage.setItem(dataKey(username), JSON.stringify(snap));
}

/**
 * Seed a built-in demo account (tester / test1234) so the public login always
 * works on a fresh browser. Idempotent; does not change the active session.
 */
export function ensureDemoUser(): void {
  try {
    const users = loadUsers();
    if (users['tester']) return;
    // Precomputed SHA-256 of "test1234".
    users['tester'] = {
      email: 'tester@dayone.app',
      passHash: '937e8d5fbb48bd4949536cd65b8d35c426b80d2f830c5c308e2cdec422ae2244',
    };
    saveUsers(users);
    const day = new Date();
    const dueTomorrow = new Date(day.getTime() + 86400000);
    dueTomorrow.setHours(23, 59, 0, 0);
    const due = dueTomorrow.toISOString();
    saveUserData('tester', {
      name: 'tester',
      email: 'tester@dayone.app',
      prefs: { ...DEFAULT_PREFS },
      startMin: 15 * 60,
      categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
      tasks: [
        { id: 'demo1', title: 'Math problem set', category: 'homework', importance: 4, dueISO: due, estMinutes: 60, status: 'pending', reward: '30 min screen time' },
        { id: 'demo2', title: 'Study for biology test', category: 'study-test', importance: 5, dueISO: due, estMinutes: 90, status: 'pending' },
        { id: 'demo3', title: 'Take out the trash', category: 'chores', importance: 2, dueISO: due, estMinutes: 15, status: 'pending', reward: '$2' },
      ],
    });
  } catch {
    /* localStorage unavailable — ignore */
  }
}

/** Create a new account. Throws if the username is taken. */
export async function registerLocal(
  username: string,
  email: string,
  password: string,
  initial: UserSnapshot,
): Promise<void> {
  const key = username.toLowerCase();
  const users = loadUsers();
  if (users[key]) throw new Error('That username is already taken.');
  users[key] = { email, passHash: await hashPassword(password) };
  saveUsers(users);
  saveUserData(username, initial);
  setSession(username);
}

/** Verify credentials and return the user's saved data. */
export async function loginLocal(
  username: string,
  password: string,
): Promise<UserSnapshot> {
  const key = username.toLowerCase();
  const user = loadUsers()[key];
  if (!user) throw new Error('No account with that username.');
  if (user.passHash !== (await hashPassword(password)))
    throw new Error('Incorrect password.');
  setSession(username);
  return (
    loadUserData(username) ?? {
      name: username,
      email: user.email,
      prefs: { sleepMin: 1380, breakCadence: 60, breakMinutes: 10, rewardsEnabled: true },
      tasks: [],
      startMin: 15 * 60,
      categories: [],
    }
  );
}
