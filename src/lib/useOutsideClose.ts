import { useEffect, useRef } from 'react';

/**
 * Returns a ref to attach to a popover container. While `active`, any mousedown
 * outside that container calls `onClose`. Clicks on the trigger/popover (inside
 * the container) are ignored, so re-clicking the trigger never closes/reopens it.
 */
export function useOutsideClose<T extends HTMLElement>(active: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [active, onClose]);
  return ref;
}
