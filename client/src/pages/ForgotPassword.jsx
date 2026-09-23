import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { forgotPassword } from '../services/authService.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Enter your account email.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await forgotPassword(email);
      setSent(true);
      setDevLink(data.resetLink || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Forgot your password?</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your account email and we'll send you a reset link.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              If an account exists for <strong>{email}</strong>, a password reset link is on its way.
              It expires in 1 hour.
            </div>
            {devLink && (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  Development reset link
                </p>
                <a href={devLink} className="break-all font-medium text-brand-700 underline">
                  {devLink}
                </a>
              </div>
            )}
            <p className="text-sm text-muted">
              Didn't get it?{' '}
              <button type="button" onClick={() => setSent(false)} className="font-semibold text-brand-700 hover:underline">
                Try again
              </button>
            </p>
            <Link to="/login" className="block text-center text-sm font-semibold text-brand-700 hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
            <Button type="submit" size="lg" loading={loading} className="w-full">
              Send reset link
            </Button>
            <Link to="/login" className="block text-center text-sm text-muted hover:text-ink">
              Remembered your password? <span className="font-semibold text-brand-700">Sign in</span>
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}