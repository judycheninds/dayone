import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { isCloudEnabled } from '../lib/supabase';
import { getCurrentUser, onAuthChange, pull, push } from '../lib/cloud';

/**
 * Headless component that keeps the store in sync with Supabase.
 * - On sign-in: pull the cloud snapshot into the store.
 * - On task/prefs change: debounced push back to the cloud.
 * No-op when cloud isn't configured (guest mode).
 */
export function CloudSync() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastJson = useRef<string>('');

  // Restore session + react to auth changes.
  useEffect(() => {
    if (!isCloudEnabled) return;
    let active = true;

    const hydrateFor = async (id: string, email: string) => {
      try {
        const remote = await pull(id);
        if (!active) return;
        if (remote) {
          useStore.getState().hydrate(remote, id, email);
        } else {
          useStore.getState().setCloudUserId(id);
        }
      } catch {
        if (active) useStore.getState().setCloudUserId(id);
      }
    };

    getCurrentUser().then((u) => {
      if (u && active) hydrateFor(u.id, u.email);
    });

    const off = onAuthChange((u) => {
      if (!active) return;
      if (u) hydrateFor(u.id, u.email);
    });

    return () => {
      active = false;
      off();
    };
  }, []);

  // Debounced push whenever the synced slice changes.
  useEffect(() => {
    if (!isCloudEnabled) return;
    const unsub = useStore.subscribe((s) => {
      if (!s.cloudUserId || !s.account) return;
      const snapshot = {
        name: s.account.name,
        prefs: s.prefs,
        tasks: s.tasks,
        startMin: s.startMin,
        categories: s.categories,
      };
      const json = JSON.stringify(snapshot);
      if (json === lastJson.current) return;
      lastJson.current = json;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        push(s.cloudUserId!, snapshot).catch(() => {});
      }, 800);
    });
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return null;
}
