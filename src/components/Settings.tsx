import { useState } from 'react';
import { useStore } from '../store';
import { signOut as cloudSignOut } from '../lib/cloud';
import { BREAK_CADENCES, BREAK_LENGTHS, WINDDOWN_OPTIONS, normalizeWeight } from '../types';
import { input } from './ui';
import { SwatchPicker } from './SwatchPicker';
import { StarRating } from './StarRating';
import { TimeField } from './TimeField';

export function Settings({ onClose }: { onClose: () => void }) {
  const prefs = useStore((s) => s.prefs);
  const updatePrefs = useStore((s) => s.updatePrefs);
  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const removeCategory = useStore((s) => s.removeCategory);
  const signOut = useStore((s) => s.signOut);
  const account = useStore((s) => s.account);

  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#0ea5e9');
  const [showParent2, setShowParent2] = useState(
    !!(prefs.parent2Name || prefs.parent2Email || prefs.parent2Phone),
  );
  const rewardsOn = prefs.rewardsEnabled !== false;

  const addNew = () => {
    if (!newLabel.trim()) return;
    addCategory(newLabel, newColor);
    setNewLabel('');
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-stone-900/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-black/[0.06] bg-[var(--card)] p-6 shadow-2xl fd-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-stone-900">Settings</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-900"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <span className="mb-1.5 block text-sm text-stone-600">Sleep by</span>
          <TimeField value={prefs.sleepMin} onChange={(m) => updatePrefs({ sleepMin: m })} />
        </div>

        <div className="mb-5">
          <span className="mb-1.5 block text-sm text-stone-600">Wind-down buffer</span>
          <div className="flex flex-wrap gap-2">
            {WINDDOWN_OPTIONS.map((w) => (
              <button
                key={w}
                onClick={() => updatePrefs({ windDownMin: w })}
                className={`flex-1 rounded-xl border px-2 py-2.5 text-sm transition ${
                  prefs.windDownMin === w
                    ? 'border-[var(--accent)] bg-[var(--accent-weak)] text-[var(--accent)]'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                {w}m
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <span className="mb-1.5 block text-sm text-stone-600">Break every</span>
          <div className="flex flex-wrap gap-2">
            {BREAK_CADENCES.map((c) => (
              <button
                key={c}
                onClick={() => updatePrefs({ breakCadence: c })}
                className={`flex-1 rounded-xl border px-2 py-2.5 text-sm transition ${
                  prefs.breakCadence === c
                    ? 'border-[var(--accent)] bg-[var(--accent-weak)] text-[var(--accent)]'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                {c}m
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <span className="mb-1.5 block text-sm text-stone-600">Break length</span>
          <div className="flex gap-2">
            {BREAK_LENGTHS.map((b) => (
              <button
                key={b}
                onClick={() => updatePrefs({ breakMinutes: b })}
                className={`flex-1 rounded-xl border px-2 py-2.5 text-sm transition ${
                  prefs.breakMinutes === b
                    ? 'border-[var(--accent)] bg-[var(--accent-weak)] text-[var(--accent)]'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                {b}m
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between rounded-xl border border-black/[0.06] bg-white/50 px-3.5 py-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-medium text-stone-800">Competition reward</span>
              <span className="text-xs text-stone-400">with parent</span>
            </div>
            <div className="text-xs text-stone-500">Attach rewards to tasks and notify a parent</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={rewardsOn}
            onClick={() => updatePrefs({ rewardsEnabled: !rewardsOn })}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${rewardsOn ? 'bg-[var(--accent)]' : 'bg-stone-300'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${rewardsOn ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        {rewardsOn && (
          <div className="mb-5 space-y-3">
            <div>
              <span className="mb-2.5 block text-sm text-stone-600">
                Parent / guardian <span className="text-stone-400">(for reward alerts)</span>
              </span>
              <div className="space-y-2">
                <input className={input} placeholder="Parent name (e.g. Mom)" value={prefs.parentName ?? ''} onChange={(e) => updatePrefs({ parentName: e.target.value })} />
                <input className={input} type="email" placeholder="Parent email" value={prefs.parentEmail ?? ''} onChange={(e) => updatePrefs({ parentEmail: e.target.value })} />
                <input className={input} type="tel" placeholder="Parent phone (for text)" value={prefs.parentPhone ?? ''} onChange={(e) => updatePrefs({ parentPhone: e.target.value })} />
              </div>
            </div>

            {showParent2 ? (
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-sm text-stone-600">Second parent / guardian</span>
                  <button
                    type="button"
                    onClick={() => {
                      updatePrefs({ parent2Name: '', parent2Email: '', parent2Phone: '' });
                      setShowParent2(false);
                    }}
                    className="text-xs text-stone-400 transition hover:text-rose-500"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-2">
                  <input className={input} placeholder="Parent name (e.g. Dad)" value={prefs.parent2Name ?? ''} onChange={(e) => updatePrefs({ parent2Name: e.target.value })} />
                  <input className={input} type="email" placeholder="Parent email" value={prefs.parent2Email ?? ''} onChange={(e) => updatePrefs({ parent2Email: e.target.value })} />
                  <input className={input} type="tel" placeholder="Parent phone (for text)" value={prefs.parent2Phone ?? ''} onChange={(e) => updatePrefs({ parent2Phone: e.target.value })} />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowParent2(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-stone-300 py-2.5 text-sm font-medium text-stone-500 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Add a second parent
              </button>
            )}
          </div>
        )}

        <div className="mb-5">
          <span className="mb-2.5 block text-sm text-stone-600">Categories &amp; priority</span>
          <div className="space-y-2.5">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={c.color}
                  onChange={(e) => updateCategory(c.id, { color: e.target.value })}
                  className="h-6 w-6 shrink-0 cursor-pointer rounded-md border border-stone-200 bg-white p-0"
                  aria-label={`${c.label} color`}
                />
                <span className="flex-1 truncate text-sm text-stone-700" title={c.label}>
                  {c.label}
                </span>
                <StarRating
                  value={normalizeWeight(c.weight)}
                  onChange={(n) => updateCategory(c.id, { weight: n })}
                  size={18}
                />
                {!c.builtin ? (
                  <button
                    onClick={() => removeCategory(c.id)}
                    className="text-stone-300 transition hover:text-rose-500"
                    aria-label={`Delete ${c.label}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <span className="w-[15px]" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2.5 rounded-xl border border-stone-200 bg-stone-50/80 p-3">
            <div className="flex items-center gap-2">
              <span
                className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-black/5"
                style={{ background: newColor }}
              />
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNew())}
                placeholder="New category name"
                className={`${input} flex-1`}
              />
              <button
                onClick={addNew}
                className="shrink-0 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                Add
              </button>
            </div>
            <SwatchPicker value={newColor} onChange={setNewColor} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-stone-200 pt-4">
          <span className="truncate text-xs text-stone-400">
            {account?.name}
            {account?.email ? ` · ${account.email}` : ''}
          </span>
          <button
            onClick={async () => {
              await cloudSignOut();
              signOut();
              onClose();
            }}
            className="text-sm font-medium text-rose-500 transition hover:text-rose-600"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
