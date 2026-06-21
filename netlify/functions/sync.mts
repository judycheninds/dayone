import { getStore } from '@netlify/blobs';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * DayOne sync backend — real cross-device accounts on Netlify Functions + Blobs.
 * Actions: ping | signup | login | pull | push.
 * Demo-grade auth: scrypt-hashed passwords, stateless HMAC session tokens.
 */

const SECRET = process.env.AUTH_SECRET || 'dayone-dev-insecure-secret';

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function hashPw(pw: string, salt: string): string {
  return scryptSync(pw, salt, 32).toString('hex');
}
function makeToken(user: string): string {
  const sig = createHmac('sha256', SECRET).update(user.toLowerCase()).digest('hex');
  return `${user.toLowerCase()}.${sig}`;
}
function verifyToken(token?: string): string | null {
  if (!token || typeof token !== 'string') return null;
  const i = token.lastIndexOf('.');
  if (i < 1) return null;
  const user = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = createHmac('sha256', SECRET).update(user).digest('hex');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) return user;
  } catch {
    /* fallthrough */
  }
  return null;
}

interface UserRec {
  email: string;
  salt: string;
  hash: string;
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Bad request' }, 400);
  }

  const action = body.action as string;
  if (action === 'ping') return json({ ok: true });

  const users = getStore('dayone-users');
  const data = getStore('dayone-data');

  if (action === 'signup') {
    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');
    const key = username.toLowerCase();
    if (username.length < 2) return json({ error: 'Username must be at least 2 characters.' }, 400);
    if (password.length < 6) return json({ error: 'Password must be at least 6 characters.' }, 400);
    if (await users.get(key, { type: 'json', consistency: 'strong' }))
      return json({ error: 'That username is taken.' }, 409);
    const salt = randomBytes(16).toString('hex');
    const rec: UserRec = { email: String(body.email ?? ''), salt, hash: hashPw(password, salt) };
    await users.setJSON(key, rec);
    const snapshot = (body.snapshot as object) ?? {};
    await data.setJSON(key, snapshot);
    return json({ token: makeToken(username), snapshot });
  }

  if (action === 'login') {
    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');
    const key = username.toLowerCase();
    const rec = (await users.get(key, { type: 'json', consistency: 'strong' })) as UserRec | null;
    if (!rec) return json({ error: 'No account with that username.' }, 404);
    if (hashPw(password, rec.salt) !== rec.hash) return json({ error: 'Incorrect password.' }, 401);
    const snapshot = (await data.get(key, { type: 'json', consistency: 'strong' })) ?? {};
    return json({ token: makeToken(username), snapshot });
  }

  // Authenticated actions.
  const user = verifyToken(body.token as string);
  if (!user) return json({ error: 'Not authenticated' }, 401);
  const key = user.toLowerCase();

  if (action === 'pull') {
    const snapshot = (await data.get(key, { type: 'json', consistency: 'strong' })) ?? {};
    return json({ snapshot });
  }
  if (action === 'push') {
    await data.setJSON(key, (body.snapshot as object) ?? {});
    return json({ ok: true });
  }

  return json({ error: 'Unknown action' }, 400);
};
