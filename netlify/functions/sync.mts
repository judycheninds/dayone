import { getStore } from '@netlify/blobs';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * DayOne sync backend — cross-device accounts on Netlify Functions + Blobs.
 * Actions: ping | signup | login | pull | push | verify | resendVerify
 *          | requestReset | reset.
 * Demo-grade auth: scrypt-hashed passwords, stateless HMAC tokens.
 * Email (verification + reset) sends via Resend when RESEND_API_KEY is set;
 * otherwise it's a no-op (flows still work, just nothing is sent yet).
 */

const SECRET = process.env.AUTH_SECRET || 'dayone-dev-insecure-secret';
const SITE_URL = process.env.URL || 'https://dayone-planner.netlify.app';

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });
}
function hashPw(pw: string, salt: string): string {
  return scryptSync(pw, salt, 32).toString('hex');
}
function safeEq(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// Session token (no expiry): "<user>.<hmac>".
function makeToken(user: string): string {
  return `${user.toLowerCase()}.${createHmac('sha256', SECRET).update(user.toLowerCase()).digest('hex')}`;
}
function verifyToken(token?: string): string | null {
  if (!token || typeof token !== 'string') return null;
  const i = token.lastIndexOf('.');
  if (i < 1) return null;
  const user = token.slice(0, i);
  return safeEq(token.slice(i + 1), createHmac('sha256', SECRET).update(user).digest('hex')) ? user : null;
}

// Purpose-scoped, expiring token for verify / reset links.
function purposeToken(purpose: string, user: string, email: string, ttlMs: number): string {
  const payload = `${purpose}:${user.toLowerCase()}:${email}:${Date.now() + ttlMs}`;
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}
function readPurposeToken(token: string, purpose: string): { user: string; email: string } | null {
  try {
    const [payload, sig] = Buffer.from(token, 'base64url').toString().split('|');
    if (!payload || !sig) return null;
    if (!safeEq(sig, createHmac('sha256', SECRET).update(payload).digest('hex'))) return null;
    const [p, user, email, exp] = payload.split(':');
    if (p !== purpose || Date.now() > Number(exp)) return null;
    return { user, email };
  } catch {
    return null;
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || 'DayOne <onboarding@resend.dev>';
  if (!key || !to) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600">${label}</a>`;
const wrap = (inner: string) =>
  `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1c1917"><h2 style="margin:0 0 8px">DayOne</h2>${inner}<p style="color:#78716c;font-size:12px;margin-top:24px">If you didn't request this, you can ignore this email.</p></div>`;

interface UserRec {
  email: string;
  salt: string;
  hash: string;
  verified?: boolean;
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
  const strong = { type: 'json', consistency: 'strong' } as const;

  if (action === 'signup') {
    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');
    const email = String(body.email ?? '').trim();
    const key = username.toLowerCase();
    if (username.length < 2) return json({ error: 'Username must be at least 2 characters.' }, 400);
    if (password.length < 6) return json({ error: 'Password must be at least 6 characters.' }, 400);
    if (await users.get(key, strong)) return json({ error: 'That username is taken.' }, 409);
    const salt = randomBytes(16).toString('hex');
    await users.setJSON(key, { email, salt, hash: hashPw(password, salt), verified: false } as UserRec);
    const snapshot = (body.snapshot as object) ?? {};
    await data.setJSON(key, snapshot);
    let emailSent = false;
    if (email) {
      const link = `${SITE_URL}/?verify=${encodeURIComponent(purposeToken('verify', username, email, 86400000))}`;
      emailSent = await sendEmail(
        email,
        'Verify your DayOne email',
        wrap(`<p>Welcome, ${username}! Confirm your email to finish setting up DayOne.</p><p style="margin:20px 0">${btn(link, 'Verify email')}</p>`),
      );
    }
    return json({ token: makeToken(username), snapshot, verified: false, emailSent });
  }

  if (action === 'login') {
    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');
    const key = username.toLowerCase();
    const rec = (await users.get(key, strong)) as UserRec | null;
    if (!rec) return json({ error: 'No account with that username.' }, 404);
    if (hashPw(password, rec.salt) !== rec.hash) return json({ error: 'Incorrect password.' }, 401);
    const snapshot = (await data.get(key, strong)) ?? {};
    return json({ token: makeToken(username), snapshot, verified: !!rec.verified });
  }

  if (action === 'verify') {
    const r = readPurposeToken(String(body.token ?? ''), 'verify');
    if (!r) return json({ error: 'This verification link is invalid or expired.' }, 400);
    const rec = (await users.get(r.user, strong)) as UserRec | null;
    if (!rec) return json({ error: 'Account not found.' }, 404);
    if (rec.email === r.email && !rec.verified) {
      rec.verified = true;
      await users.setJSON(r.user, rec);
    }
    return json({ ok: true });
  }

  if (action === 'requestReset') {
    const key = String(body.username ?? '').trim().toLowerCase();
    const rec = (await users.get(key, strong)) as UserRec | null;
    let sent = false;
    if (rec?.email) {
      const link = `${SITE_URL}/?reset=${encodeURIComponent(purposeToken('reset', key, rec.email, 3600000))}`;
      sent = await sendEmail(
        rec.email,
        'Reset your DayOne password',
        wrap(`<p>We got a request to reset your DayOne password.</p><p style="margin:20px 0">${btn(link, 'Reset password')}</p><p style="color:#78716c;font-size:12px">This link expires in 1 hour.</p>`),
      );
    }
    return json({ ok: true, sent }); // never reveal whether the account exists
  }

  if (action === 'reset') {
    const r = readPurposeToken(String(body.token ?? ''), 'reset');
    if (!r) return json({ error: 'This reset link is invalid or expired.' }, 400);
    const password = String(body.password ?? '');
    if (password.length < 6) return json({ error: 'Password must be at least 6 characters.' }, 400);
    const rec = (await users.get(r.user, strong)) as UserRec | null;
    if (!rec) return json({ error: 'Account not found.' }, 404);
    const salt = randomBytes(16).toString('hex');
    rec.salt = salt;
    rec.hash = hashPw(password, salt);
    await users.setJSON(r.user, rec);
    return json({ ok: true });
  }

  // Authenticated actions.
  const user = verifyToken(body.token as string);
  if (!user) return json({ error: 'Not authenticated' }, 401);
  const key = user.toLowerCase();

  if (action === 'resendVerify') {
    const rec = (await users.get(key, strong)) as UserRec | null;
    if (!rec) return json({ error: 'Account not found.' }, 404);
    if (rec.verified) return json({ ok: true, already: true });
    let sent = false;
    if (rec.email) {
      const link = `${SITE_URL}/?verify=${encodeURIComponent(purposeToken('verify', key, rec.email, 86400000))}`;
      sent = await sendEmail(
        rec.email,
        'Verify your DayOne email',
        wrap(`<p>Confirm your email to finish setting up DayOne.</p><p style="margin:20px 0">${btn(link, 'Verify email')}</p>`),
      );
    }
    return json({ ok: true, sent });
  }
  if (action === 'pull') {
    const rec = (await users.get(key, strong)) as UserRec | null;
    const snapshot = (await data.get(key, strong)) ?? {};
    return json({ snapshot, verified: !!rec?.verified });
  }
  if (action === 'push') {
    await data.setJSON(key, (body.snapshot as object) ?? {});
    return json({ ok: true });
  }

  return json({ error: 'Unknown action' }, 400);
};
