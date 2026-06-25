import { useState } from 'react';
import { useStore } from '../store';
import { resendVerify } from '../lib/api';

/** Non-blocking banner prompting cloud users to verify their email. */
export function VerifyBanner() {
  const cloudUser = useStore((s) => s.cloudUser);
  const emailVerified = useStore((s) => s.emailVerified);
  const email = useStore((s) => s.account?.email);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'unavailable'>('idle');

  if (!cloudUser || emailVerified) return null;

  const resend = async () => {
    setStatus('sending');
    try {
      const sent = await resendVerify();
      setStatus(sent ? 'sent' : 'unavailable');
    } catch {
      setStatus('unavailable');
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
        Verify your email{email ? ` (${email})` : ''} to secure your account.
      </span>
      <span className="ml-auto text-xs">
        {status === 'sent' ? (
          <span className="font-medium text-emerald-700">Verification email sent ✓</span>
        ) : status === 'unavailable' ? (
          <span className="text-amber-700">Email sending isn't set up yet.</span>
        ) : (
          <button
            onClick={resend}
            disabled={status === 'sending'}
            className="font-medium underline underline-offset-2 hover:text-amber-900"
          >
            {status === 'sending' ? 'Sending…' : 'Resend email'}
          </button>
        )}
      </span>
    </div>
  );
}
