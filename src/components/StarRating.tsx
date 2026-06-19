/** A clean 1–5 interactive star rating, used for both task importance and category priority. */
export function StarRating({
  value,
  onChange,
  size = 22,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            type="button"
            key={n}
            onClick={() => onChange(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className="rounded transition hover:scale-110"
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              strokeWidth="1.6"
              strokeLinejoin="round"
              style={{
                fill: filled ? 'var(--accent)' : 'transparent',
                stroke: filled ? 'var(--accent)' : '#d6d3d1',
              }}
            >
              <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.9l-5.81 3.05L7.3 14.48 2.6 9.9l6.5-.95L12 2.5z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
