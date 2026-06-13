/** Notifications via a service worker, so reminders fire while the tab is backgrounded. */

let swReg: ServiceWorkerRegistration | null = null;

export async function registerSW(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    swReg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
  } catch {
    /* SW unavailable (e.g. insecure context) — notifications fall back to page-level */
  }
}

export async function ensureNotifyPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export interface ScheduledNotice {
  id: string;
  title: string;
  body: string;
  at: number; // epoch ms to fire
}

/** Hand the full set of upcoming reminders to the service worker (replaces prior set). */
export function scheduleNotices(items: ScheduledNotice[]) {
  const ctrl = navigator.serviceWorker?.controller ?? swReg?.active;
  if (ctrl) ctrl.postMessage({ type: 'reschedule', items });
}

export function clearNotices() {
  const ctrl = navigator.serviceWorker?.controller ?? swReg?.active;
  if (ctrl) ctrl.postMessage({ type: 'clear' });
}

/** Fire a notification right now (SW if available, else a page Notification). */
export function notifyNow(title: string, body: string) {
  if (Notification.permission !== 'granted') return;
  const ctrl = navigator.serviceWorker?.controller ?? swReg?.active;
  if (ctrl) {
    ctrl.postMessage({ type: 'notify', title, body });
    return;
  }
  try {
    new Notification(title, { body, icon: '/flow-icon.svg' });
  } catch {
    /* ignore */
  }
}
