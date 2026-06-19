import { useStore } from '../store';
import { Card, SectionLabel, btnPrimary, btnGhost } from './ui';

export function RewardsCard() {
  const tasks = useStore((s) => s.tasks);
  const prefs = useStore((s) => s.prefs);
  const account = useStore((s) => s.account);
  const claimReward = useStore((s) => s.claimReward);

  if (prefs.rewardsEnabled === false) return null; // feature turned off in settings
  const withReward = tasks.filter((t) => t.reward);
  if (withReward.length === 0) return null; // nothing to show until rewards are used

  const earned = withReward.filter((t) => t.status === 'done' && !t.rewardClaimed);
  const claimed = withReward.filter((t) => t.status === 'done' && t.rewardClaimed);
  const pending = withReward.filter((t) => t.status !== 'done');

  const truthy = (x?: string): x is string => !!x;
  const names = [prefs.parentName?.trim(), prefs.parent2Name?.trim()].filter(truthy);
  const emails = [prefs.parentEmail?.trim(), prefs.parent2Email?.trim()].filter(truthy);
  const phones = [prefs.parentPhone?.trim(), prefs.parent2Phone?.trim()].filter(truthy);
  const parentName = names.join(' & ') || 'your parents';
  const student = account?.name || 'Your child';

  // Build a pre-filled message for the parent(s) about earned (unclaimed) rewards.
  const lines = earned.map((t) => `✓ ${t.title}  →  reward: ${t.reward}`);
  const subject = `${student} earned a reward on DayOne 🎉`;
  const body =
    `Hi ${names.join(' & ') || 'there'},\n\n` +
    `${student} just finished${earned.length > 1 ? ' these tasks' : ' a task'} on DayOne:\n\n` +
    `${lines.join('\n')}\n\n` +
    `Time for the reward! 🎁\n\n— sent from DayOne`;

  const mailto = `mailto:${emails.map(encodeURIComponent).join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const sms = `sms:${phones.join(',')}?body=${encodeURIComponent(body)}`;
  const canEmail = emails.length > 0;
  const canText = phones.length > 0;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionLabel>Rewards</SectionLabel>
        {earned.length > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            {earned.length} ready to claim
          </span>
        )}
      </div>

      {earned.length > 0 ? (
        <>
          <ul className="mt-3 space-y-1.5">
            {earned.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-sm"
              >
                <span className="text-base">🎁</span>
                <span className="flex-1 truncate text-stone-800">
                  {t.title} <span className="text-stone-400">·</span>{' '}
                  <span className="font-medium text-amber-700">{t.reward}</span>
                </span>
                <button
                  onClick={() => claimReward(t.id, true)}
                  className="shrink-0 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  Mark granted
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap gap-2">
            {canEmail && (
              <a href={mailto} className={`flex-1 px-3 py-2.5 text-sm ${btnPrimary}`}>
                ✉️ Email {parentName}
              </a>
            )}
            {canText && (
              <a href={sms} className={`flex-1 px-3 py-2.5 text-sm ${btnGhost}`}>
                💬 Text {parentName}
              </a>
            )}
            {!canEmail && !canText && (
              <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
                Add a parent's email or phone in <strong>Settings</strong> to notify them
                with one tap.
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-stone-500">
          {pending.length > 0
            ? `Finish a task with a reward to unlock it. ${pending.length} reward${pending.length > 1 ? 's' : ''} waiting.`
            : 'No rewards to claim right now.'}
        </p>
      )}

      {claimed.length > 0 && (
        <div className="mt-3 border-t border-stone-100 pt-3">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-stone-400">
            Granted
          </p>
          <ul className="space-y-1">
            {claimed.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-xs text-stone-400">
                <span className="text-emerald-500">✓</span>
                <span className="flex-1 truncate line-through">{t.title} · {t.reward}</span>
                <button onClick={() => claimReward(t.id, false)} className="hover:text-stone-600">
                  undo
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
