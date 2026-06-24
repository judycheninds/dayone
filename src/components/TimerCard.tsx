import { fmtMin } from '../lib/time';

interface Props {
  title: string;
  endMin?: number;
  color: string;
  secondsLeft: number; // may be negative (overtime)
  fraction: number; // 0..1 elapsed
  isBreak: boolean;
  done?: boolean;
  compact?: boolean; // PiP layout
  confirming?: boolean; // awaiting "are you finished?" confirmation
  onExtend: (min: number) => void;
  onFinish: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClosePip?: () => void;
}

function clock(sec: number): string {
  const neg = sec < 0;
  const s = Math.abs(Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${neg ? '-' : ''}${m}:${r.toString().padStart(2, '0')}`;
}

function Ring({
  size,
  stroke,
  remaining,
  color,
  over,
  children,
}: {
  size: number;
  stroke: number;
  remaining: number;
  color: string;
  over: boolean;
  children: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const len = Math.max(0, Math.min(1, remaining)) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(28,25,23,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? '#fb7185' : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${len} ${c}`}
          style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function TimerCard(p: Props) {
  if (p.done) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div>
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl">
            🎉
          </div>
          <div className="text-lg font-semibold text-stone-900">All done!</div>
          <div className="mt-1 text-sm text-stone-500">Everything scheduled is complete.</div>
        </div>
      </div>
    );
  }

  const over = p.secondsLeft < 0;
  const remaining = 1 - p.fraction;
  const size = p.compact ? 116 : 208;
  const stroke = p.compact ? 8 : 12;

  return (
    <div className={`relative flex h-full flex-col items-center ${p.compact ? 'gap-2 p-3' : 'gap-5 p-7'}`}>
      {p.compact && p.onClosePip && (
        <button
          onClick={p.onClosePip}
          aria-label="Close floating timer"
          title="Close (timer keeps running)"
          className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-stone-400 transition hover:bg-black/10 hover:text-stone-700"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
      <div className="flex items-center gap-2 text-xs">
        <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
        <span className="font-medium uppercase tracking-[0.14em] text-stone-500">
          {p.confirming ? 'Confirm' : p.isBreak ? 'Break' : over ? 'Overtime' : 'Focusing'}
        </span>
      </div>

      <Ring size={size} stroke={stroke} remaining={remaining} color={p.color} over={over}>
        <div className="text-center">
          <div className={`font-bold tabular-nums ${over ? 'text-rose-500' : 'text-stone-900'} ${p.compact ? 'text-2xl' : 'text-5xl'}`}>
            {clock(p.secondsLeft)}
          </div>
          {!p.compact && p.endMin != null && (
            <div className="mt-1 text-xs text-stone-400">until {fmtMin(p.endMin)}</div>
          )}
        </div>
      </Ring>

      <div className={`w-full text-center ${p.compact ? '' : 'px-2'}`}>
        <div className={`truncate font-semibold text-stone-900 ${p.compact ? 'text-sm' : 'text-xl'}`} title={p.title}>
          {p.isBreak ? '☕ Take a breather' : p.title}
        </div>
      </div>

      {p.confirming ? (
        <div className="mt-auto w-full">
          {!p.compact && (
            <p className="mb-2 text-center text-sm text-stone-500">Did you finish this task?</p>
          )}
          <div className="flex w-full gap-2">
            <button
              onClick={p.onCancel}
              className={`flex-1 rounded-xl border border-stone-200 bg-white font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 active:scale-[0.99] ${
                p.compact ? 'py-1.5 text-xs' : 'py-3 text-sm'
              }`}
            >
              Not yet
            </button>
            <button
              onClick={p.onConfirm}
              className={`flex-1 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 font-medium text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.99] ${
                p.compact ? 'py-1.5 text-xs' : 'py-3 text-sm'
              }`}
            >
              Yes, finished ✓
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex w-full gap-2">
          <button
            onClick={() => p.onExtend(10)}
            className={`flex-1 rounded-xl border border-stone-200 bg-white font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 active:scale-[0.99] ${
              p.compact ? 'py-1.5 text-xs' : 'py-3 text-sm'
            }`}
          >
            +10 min
          </button>
          <button
            onClick={p.onFinish}
            className={`flex-1 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 font-medium text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.99] ${
              p.compact ? 'py-1.5 text-xs' : 'py-3 text-sm'
            }`}
          >
            {p.isBreak ? 'Skip' : 'Done ✓'}
          </button>
        </div>
      )}
    </div>
  );
}
