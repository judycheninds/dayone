import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { openPipWindow } from '../lib/pip';

interface Props {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Renders children into a Document Picture-in-Picture window via a React portal. */
export function PipPortal({ open, onClose, children }: Props) {
  const [pipWin, setPipWin] = useState<Window | null>(null);

  useEffect(() => {
    let win: Window | null = null;
    let cancelled = false;

    if (open && !pipWin) {
      openPipWindow(320, 230).then((w) => {
        if (cancelled || !w) {
          if (!w) onClose();
          return;
        }
        win = w;
        w.addEventListener('pagehide', onClose);
        setPipWin(w);
      });
    }
    if (!open && pipWin) {
      pipWin.close();
      setPipWin(null);
    }

    return () => {
      cancelled = true;
      if (win) win.removeEventListener('pagehide', onClose);
    };
  }, [open, pipWin, onClose]);

  // Close the PiP window if this component unmounts while open.
  useEffect(() => {
    return () => {
      if (pipWin) pipWin.close();
    };
  }, [pipWin]);

  if (!pipWin) return null;
  return createPortal(
    <div style={{ height: '100vh', width: '100vw' }}>{children}</div>,
    pipWin.document.body,
  );
}
