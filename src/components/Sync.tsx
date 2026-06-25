import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { cloudSession, pullCloud, pushCloud, type CloudSnapshot } from '../lib/api';

/** Keeps the signed-in account synced with the cloud backend across devices. */
export function Sync() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastJson = useRef('');

  // On load: if there's a cloud session, pull the freshest data from the server.
  useEffect(() => {
    const sess = cloudSession();
    if (!sess) return;
    let active = true;
    pullCloud()
      .then((r) => {
        if (active && r?.snapshot) useStore.getState().applyAuth(r.snapshot, sess.username, r.verified);
      })
      .catch(() => {
        /* offline — the cached snapshot from bootstrap is already shown */
      });
    return () => {
      active = false;
    };
  }, []);

  // Debounced push whenever the synced data changes.
  useEffect(() => {
    const unsub = useStore.subscribe((s) => {
      if (!s.cloudUser || !s.account) return;
      const snapshot: CloudSnapshot = {
        name: s.account.name,
        email: s.account.email,
        prefs: s.prefs,
        tasks: s.tasks,
        startMin: s.startMin,
        categories: s.categories,
        history: s.history,
      };
      const json = JSON.stringify(snapshot);
      if (json === lastJson.current) return;
      lastJson.current = json;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        pushCloud(snapshot).catch(() => {});
      }, 700);
    });
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return null;
}
