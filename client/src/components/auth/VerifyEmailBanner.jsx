import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { resendVerification } from '../../services/authService.js';

export default function VerifyEmailBanner() {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!user || user.emailVerified) return null;

  const resend = async () => {
    setSending(true);
    setError('');
    try {
      await resendVerification(user.email);
      setSent(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not send the email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-b border-gold-200 bg-gold-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
        <span className="font-medium text-ink">Verify your email to activate your account.</span>
        {sent ? (
          <span className="text-muted">Verification email sent — check your inbox.</span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={sending}
            className="font-semibold text-brand-700 hover:underline disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Resend email'}
          </button>
        )}
        {error && <span className="text-red-700">{error}</span>}
      </div>
    </div>
  );
}