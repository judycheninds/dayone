# DayOne

A student schedule-optimizer. At the end of the school day, dump in your tasks and
DayOne builds an optimized, time-blocked evening that fits before your bedtime — with
automatic breaks, a live run timer, 5-minutes-left reminders, and a floating
picture-in-picture timer.

**Live demo:** https://flowday-25383.netlify.app

## Run

```bash
npm install
npm run dev      # http://localhost:5174
npm test         # scheduling-engine unit tests (vitest)
npm run build    # type-check + production build
```

## How it works

- **Account / setup** — `Onboarding` collects name, email, target **sleep time**,
  wind-down buffer, and break cadence (60 / 90 min). Editable later in **Settings**.
- **Brain dump** — `TaskEntry`: each task has a category (Homework, Chores, Classes,
  Work, Studying-Test, Studying-Quiz), an importance (1–5★), a natural-language due
  date (Today / Tomorrow / In 3 days / Next week / pick a date), and an estimated time.
- **Scheduling engine** — [`src/lib/scheduler.ts`](src/lib/scheduler.ts) is a pure,
  unit-tested module. `scoreTask` ranks each task by `urgency + categoryWeight +
  importance`; `buildSchedule` places them in priority order, inserts breaks after the
  cadence, and flags anything that won't fit before `sleep − windDown` as **overflow**.
- **Run mode** — `RunMode` runs a live countdown anchored to the wall clock.
  - **+10m** extends the current task and *shifts* all later blocks (preserves elapsed).
  - **Done** marks the task complete and *rebuilds* the remaining schedule from now.
  - A one-time **5-minutes-left** notification fires per task (Web Notifications API).
- **Picture-in-Picture** — `PipPortal` renders the timer into a Document
  Picture-in-Picture window (Chromium 116+) that floats on top while you work.

## Architecture

```
React UI (Vite + Tailwind)
  Onboarding · TaskEntry · Timeline · RunMode · PipPortal · Settings
        │
  Zustand store (persisted to localStorage)  ── runSnapshot for live mode
        │
  Scheduling engine (pure TS, tested)  +  Web Notifications  +  Document PiP
```

State is **local-first** (Zustand + `localStorage`) and works with no backend (guest
mode). Add Supabase credentials to turn on accounts + cross-device sync.

## Cloud sync (Supabase)

Optional — the app runs fully in guest mode without it.

1. Create a Supabase project.
2. Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in the
   SQL editor (creates a `profiles` table with row-level security).
3. In **Auth → Providers → Email**, turn **off** "Confirm email" for the simplest
   sign-up flow (otherwise users must confirm before their first sync).
4. `cp .env.example .env` and fill in `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
5. Restart `npm run dev`. Onboarding now shows Sign-up / Log-in (with a guest option),
   and the store syncs to the cloud automatically ([`CloudSync`](src/components/CloudSync.tsx)).

## Notifications

A service worker ([`public/sw.js`](public/sw.js)) schedules the "5 minutes left"
reminders, so they fire even when the tab is **backgrounded**. Firing when the browser
is **fully closed** would need the Push API + VAPID keys + a server to send the push —
that's the next step.

## Roadmap

- Web Push (VAPID) for closed-browser reminders
- Split long tasks across break boundaries
- Native mobile (Expo) with system PiP
