import { useEffect, useState } from 'react';

/**
 * A soft, light background whose color pattern shifts with the time of day —
 * peachy at dawn, airy in the morning, warm at midday, golden in the afternoon,
 * violet at dusk, and cool indigo at night. Kept pale and low-contrast.
 */
function gradientForHour(h: number): string {
  if (h >= 5 && h < 8) {
    // dawn — peach / rose
    return [
      'radial-gradient(70rem 60rem at 12% -10%, rgba(251,146,120,0.18), transparent 60%)',
      'radial-gradient(60rem 50rem at 90% 0%, rgba(244,164,96,0.15), transparent 55%)',
      '#f3eae2',
    ].join(',');
  }
  if (h >= 8 && h < 11) {
    // morning — sky / mint
    return [
      'radial-gradient(70rem 60rem at 15% -10%, rgba(56,189,248,0.14), transparent 60%)',
      'radial-gradient(60rem 50rem at 88% 5%, rgba(45,212,191,0.12), transparent 55%)',
      '#e9eff0',
    ].join(',');
  }
  if (h >= 11 && h < 15) {
    // midday — warm neutral
    return [
      'radial-gradient(75rem 60rem at 50% -20%, rgba(120,113,108,0.07), transparent 60%)',
      'radial-gradient(55rem 45rem at 88% 0%, rgba(245,165,36,0.08), transparent 55%)',
      '#efece6',
    ].join(',');
  }
  if (h >= 15 && h < 18) {
    // afternoon — golden sand
    return [
      'radial-gradient(70rem 60rem at 12% -10%, rgba(245,165,36,0.16), transparent 60%)',
      'radial-gradient(60rem 50rem at 90% 0%, rgba(224,122,78,0.12), transparent 55%)',
      '#f1ebe1',
    ].join(',');
  }
  if (h >= 18 && h < 22) {
    // dusk — violet / rose
    return [
      'radial-gradient(70rem 60rem at 15% -10%, rgba(168,85,247,0.15), transparent 60%)',
      'radial-gradient(60rem 50rem at 88% 5%, rgba(244,114,182,0.12), transparent 55%)',
      '#ece9f1',
    ].join(',');
  }
  // night — cool indigo
  return [
    'radial-gradient(70rem 60rem at 15% -10%, rgba(99,102,241,0.14), transparent 60%)',
    'radial-gradient(60rem 50rem at 90% 10%, rgba(139,92,246,0.12), transparent 55%)',
    '#e9e9f2',
  ].join(',');
}

export function TimeBackground() {
  const [bg, setBg] = useState(() => gradientForHour(new Date().getHours()));

  useEffect(() => {
    const update = () => setBg(gradientForHour(new Date().getHours()));
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
