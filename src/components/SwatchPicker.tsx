/** A clean preset-swatch color picker with a custom-color fallback. */

const SWATCHES = [
  '#e5484d', // red
  '#f76808', // orange
  '#f5a524', // amber
  '#30a46c', // green
  '#14b8a6', // teal
  '#0ea5e9', // sky
  '#3e63dd', // blue
  '#8e4ec6', // violet
  '#ec4899', // pink
  '#80838d', // gray
];

export function SwatchPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const isPreset = SWATCHES.some((c) => c.toLowerCase() === value.toLowerCase());
  return (
    <div className="flex flex-wrap items-center gap-2">
      {SWATCHES.map((c) => {
        const selected = c.toLowerCase() === value.toLowerCase();
        return (
          <button
            type="button"
            key={c}
            onClick={() => onChange(c)}
            aria-label={`Color ${c}`}
            className={`grid h-6 w-6 place-items-center rounded-full transition hover:scale-110 ${
              selected ? 'ring-2 ring-stone-900/70 ring-offset-2 ring-offset-white' : ''
            }`}
            style={{ background: c }}
          >
            {selected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </button>
        );
      })}
      {/* Custom color */}
      <label
        className={`relative grid h-6 w-6 cursor-pointer place-items-center overflow-hidden rounded-full ${
          !isPreset ? 'ring-2 ring-stone-900/70 ring-offset-2 ring-offset-white' : ''
        }`}
        title="Custom color"
        style={{
          background: !isPreset
            ? value
            : 'conic-gradient(#ef4444,#f59e0b,#eab308,#22c55e,#06b6d4,#3b82f6,#a855f7,#ec4899,#ef4444)',
        }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        {!isPreset && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </label>
    </div>
  );
}
