import type { CSSProperties } from 'react';

const COLORS = ['#e5484d', '#f76808', '#3e63dd', '#8e4ec6', '#30a46c', '#f5a524'];

/**
 * A small confetti burst anchored to the bottom-right corner (where the PiP
 * mini-player lives). Re-fires whenever `fireKey` changes (key remount replays
 * the CSS animation).
 */
export function Confetti({ fireKey }: { fireKey: number }) {
  if (!fireKey) return null;
  const pieces = Array.from({ length: 44 }, (_, i) => i);
  return (
    <div key={fireKey} className="pointer-events-none fixed bottom-6 right-6 z-[70]" aria-hidden>
      {pieces.map((i) => {
        const tx = -(Math.random() * 320 + 10); // burst left, wider spread
        const ty = -(Math.random() * 320 + 20); // burst up, wider spread
        const rot = Math.random() * 900 - 450;
        const size = 7 + Math.random() * 8;
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
