import { useEffect, useState } from 'react';

/**
 * A soft, light background whose color pattern shifts with the time of day —
 * peachy at dawn, airy in the morning, warm at midday, golden in the afternoon,
 * violet at dusk, and cool indigo at night. Kept pale and low-contrast.
 */
interface Theme {
  bg: string;
  /** Accent = complement of the background's dominant hue. */
  accent: string;
  accentWeak: string;
}

function themeForHour(h: number): Theme {
  if (h >= 5 && h < 8) {
    // dawn — peach/rose bg → teal accent
    return {
      bg: 'radial-gradient(70rem 60rem at 12% -10%, rgba(251,146,120,0.18), transparent 60%),radial-gradient(60rem 50rem at 90% 0%, rgba(244,164,96,0.15), transparent 55%),#f3eae2',
      accent: '#0d9488',
      accentWeak: 'rgba(13,148,136,0.16)',
    };
  }
  if (h >= 8 && h < 11) {
    // morning — sky/mint bg → orange accent
    return {
      bg: 'radial-gradient(70rem 60rem at 15% -10%, rgba(56,189,248,0.14), transparent 60%),radial-gradient(60rem 50rem at 88% 5%, rgba(45,212,191,0.12), transparent 55%),#e9eff0',
      accent: '#ea580c',
      accentWeak: 'rgba(234,88,12,0.15)',
    };
  }
  if (h >= 11 && h < 15) {
    // midday — warm neutral bg → indigo accent
    return {
      bg: 'radial-gradient(75rem 60rem at 50% -20%, rgba(120,113,108,0.07), transparent 60%),radial-gradient(55rem 45rem at 88% 0%, rgba(245,165,36,0.08), transparent 55%),#efece6',
      accent: '#4f46e5',
      accentWeak: 'rgba(79,70,229,0.16)',
    };
  }
  if (h >= 15 && h < 18) {
    // afternoon — golden bg → indigo/blue accent
    return {
      bg: 'radial-gradient(70rem 60rem at 12% -10%, rgba(245,165,36,0.16), transparent 60%),radial-gradient(60rem 50rem at 90% 0%, rgba(224,122,78,0.12), transparent 55%),#f1ebe1',
      accent: '#4338ca',
      accentWeak: 'rgba(67,56,202,0.15)',
    };
  }
  if (h >= 18 && h < 22) {
    // dusk — violet/rose bg → green accent
    return {
      bg: 'radial-gradient(70rem 60rem at 15% -10%, rgba(168,85,247,0.15), transparent 60%),radial-gradient(60rem 50rem at 88% 5%, rgba(244,114,182,0.12), transparent 55%),#ece9f1',
      accent: '#16a34a',
      accentWeak: 'rgba(22,163,74,0.15)',
    };
  }
  // night — indigo bg → amber accent
  return {
    bg: 'radial-gradient(70rem 60rem at 15% -10%, rgba(99,102,241,0.14), transparent 60%),radial-gradient(60rem 50rem at 90% 10%, rgba(139,92,246,0.12), transparent 55%),#e9e9f2',
    accent: '#d97706',
    accentWeak: 'rgba(217,119,6,0.16)',
  };
}

export function TimeBackground() {
  const [bg, setBg] = useState(() => themeForHour(new Date().getHours()).bg);

  useEffect(() => {
    const update = () => {
      const t = themeForHour(new Date().getHours());
      setBg(t.bg);
      const root = document.documentElement;
      root.style.setProperty('--accent', t.accent);
      root.style.setProperty('--accent-weak', t.accentWeak);
    };
    update();
    const id = setInterval(update, 5 * 60 * 1000); // re-check every 5 min
    return () => clearInterval(id);
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10"
      style={{ background: bg, transition: 'background 3s ease-in-out' }}
    />
  );
}
