import type { CSSProperties } from 'react';

const COLORS = ['#e5484d', '#f76808', '#3e63dd', '#8e4ec6', '#30a46c', '#f5a524'];

/**
 * A small confetti burst anchored to the bottom-right corner (where the PiP
 * mini-player lives). Re-fires whenever `fireKey` changes (key remount replays
 * the CSS animation).
 */
export function Confetti({ fireKey }: { fireKey: number }) {
  if (!fireKey) return null;
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div key={fireKey} className="pointer-events-none fixed bottom-8 right-8 z-[70]" aria-hidden>
      {pieces.map((i) => {
        const tx = -(Math.random() * 190 + 10); // burst left
        const ty = -(Math.random() * 190 + 30); // burst up
        const rot = Math.random() * 760 - 380;
        const size = 6 + Math.random() * 6;
        const style: CSSProperties = {
          width: size,
          height: size,
          background: COLORS[i % COLORS.length],
          animationDelay: `${Math.random() * 70}ms`,
          ['--tx' as string]: `${tx}px`,
          ['--ty' as string]: `${ty}px`,
          ['--rot' as string]: `${rot}deg`,
        };
        return <span key={i} className="confetti-piece" style={style} />;
      })}
    </div>
  );
}
