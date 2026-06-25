/** Client for the DayOne sync backend (Netlify Function). Falls back to local
 *  accounts when the backend isn't reachable (e.g. plain `vite` dev). */
import type { CategoryDef, Prefs, Task } from '../types';

const ENDPOINT = '/.netlify/functions/sync';
const TOKEN_KEY = 'dayone-token';
const USER_KEY = 'dayone-cloud-user';
const cacheKey = (u: string) => `dayone-cloud-cache-${u.toLowerCase()}`;

export interface CloudSnapshot {
  name: string;
  email: string;
  prefs: Prefs;
  tasks: Task[];
  startMin: number;
  categories: CategoryDef[];
}

export class UnavailableError extends Error {
  code = 'UNAVAILABLE' as const;
}

let token = localStorage.getItem(TOKEN_KEY);
let username = localStorage.getItem(USER_KEY);

export function cloudSession(): { token: string; username: string } | null {
  return token && username ? { token, username } : null;
}

function setSession(t: string, u: string) {
  token = t;
  username = u;
  localStorage.setItem(TOKEN_KEY, t);
  localStorage.setItem(USER_KEY, u);
}

export function clearSession() {
  if (username) localStorage.removeItem(cacheKey(username));
  token = null;
  username = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function loadCache(u: string): CloudSnapshot | null {
  try {
    const raw = localStorage.getItem(cacheKey(u));
    return raw ? (JSON.parse(raw) as CloudSnapshot) : null;
  } catch {
    return null;
  }
}
export function saveCache(u: string, snap: CloudSnapshot) {
  localStorage.setItem(cacheKey(u), JSON.stringify(snap));
}

async function call(action: string, payload: Record<string, unknown>): Promise<any> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    throw new UnavailableError('Backend unreachable');
  }
  if (res.status === 404 || res.status === 501 || res.status === 502) {
    throw new UnavailableError('Backend not deployed');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export interface AuthResult {
  snapshot: CloudSnapshot;
  verified: boolean;
  emailSent?: boolean;
}

export async function signupCloud(
  u: string,
  email: string,
  password: string,
  snapshot: CloudSnapshot,
): Promise<AuthResult> {
  const r = await call('signup', { username: u, email, password, snapshot });
  setSession(r.token, u);
  saveCache(u, snapshot);
  return { snapshot: r.snapshot, verified: !!r.verified, emailSent: r.emailSent };
}

export async function loginCloud(u: string, password: string): Promise<AuthResult> {
  const r = await call('login', { username: u, password });
  setSession(r.token, u);
  if (r.snapshot) saveCache(u, r.snapshot);
  return { snapshot: r.snapshot, verified: !!r.verified };
}

export async function pullCloud(): Promise<AuthResult | null> {
  if (!token || !username) return null;
  const r = await call('pull', { token });
  if (!r.snapshot) return null;
  saveCache(username, r.snapshot);
  return { snapshot: r.snapshot, verified: !!r.verified };
}

export async function verifyEmail(t: string): Promise<void> {
  await call('verify', { token: t });
}
export async function resendVerify(): Promise<boolean> {
  if (!token) return false;
  const r = await call('resendVerify', { token });
  return !!r.sent;
}
export async function requestReset(u: string): Promise<boolean> {
  const r = await call('requestReset', { username: u });
  return !!r.sent;
}
export async function resetPassword(t: string, password: string): Promise<void> {
  await call('reset', { token: t, password });
}

export async function pushCloud(snapshot: CloudSnapshot): Promise<void> {
  if (!token || !username) return;
  saveCache(username, snapshot);
  await call('push', { token, snapshot });
}
