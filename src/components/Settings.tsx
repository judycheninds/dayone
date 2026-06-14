import { useState } from 'react';
import { useStore } from '../store';
import { parseHHMM, toHHMM } from '../lib/time';
import { signOut as cloudSignOut } from '../lib/cloud';
import { input } from './ui';
import { SwatchPicker } from './SwatchPicker';

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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl fd-rise"
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

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm text-stone-600">Sleep by</span>
          <input
            type="time"
            value={toHHMM(prefs.sleepMin)}
            onChange={(e) => updatePrefs({ sleepMin: parseHHMM(e.target.value) })}
            className={input}
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm text-stone-600">
            Wind-down buffer · {prefs.windDownMin} min
          </span>
          <input
            type="range"
            min={0}
            max={90}
            step={15}
            value={prefs.windDownMin}
            onChange={(e) => updatePrefs({ windDownMin: Number(e.target.value) })}
            className="w-full accent-indigo-500"
          />
        </label>

        <div className="mb-5">
          <span className="mb-1.5 block text-sm text-stone-600">Break cadence</span>
          <div className="flex gap-2">
            {([60, 90] as const).map((c) => (
              <button
                key={c}
                onClick={() => updatePrefs({ breakCadence: c })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm transition ${
                  prefs.breakCadence === c
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                every {c} min
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <span className="mb-2.5 block text-sm text-stone-600">
            Parent / guardian <span className="text-stone-400">(for reward alerts)</span>
          </span>
          <div className="space-y-2">
            <input
              className={input}
              placeholder="Parent name (e.g. Mom)"
              value={prefs.parentName ?? ''}
              onChange={(e) => updatePrefs({ parentName: e.target.value })}
            />
            <input
              className={input}
              type="email"
              placeholder="Parent email"
              value={prefs.parentEmail ?? ''}
              onChange={(e) => updatePrefs({ parentEmail: e.target.value })}
            />
            <input
              className={input}
              type="tel"
              placeholder="Parent phone (for text)"
              value={prefs.parentPhone ?? ''}
              onChange={(e) => updatePrefs({ parentPhone: e.target.value })}
            />
          </div>
        </div>

        <div className="mb-5">
          <span className="mb-2.5 block text-sm text-stone-600">
            Categories &amp; priority (0–10)
          </span>
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
                <span className="w-28 shrink-0 truncate text-xs text-stone-600" title={c.label}>
                  {c.label}
                </span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={c.weight}
                  onChange={(e) => updateCategory(c.id, { weight: Number(e.target.value) })}
                  className="flex-1"
                  style={{ accentColor: c.color }}
                />
                <span className="w-4 text-right text-xs tabular-nums text-stone-600">{c.weight}</span>
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
