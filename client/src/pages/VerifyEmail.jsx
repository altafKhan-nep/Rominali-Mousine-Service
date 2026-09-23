import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import AuthLayout from '../components/auth/AuthLayout.jsx';
import { verifyEmail } from '../services/authService.js';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [state, setState] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Missing verification token. Use the link from your email.');
      return;
    }
    let cancelled = false;
    verifyEmail(token)
      .then(() => !cancelled && setState('success'))
      .catch((err) => {
        if (!cancelled) {
          setState('error');
          setMessage(err.response?.data?.message || 'Verification failed.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const copy = {
    verifying: { title: 'Verifying your email…', sub: 'Just a moment.' },
    success: {
      title: 'Email verified',
      sub: 'Your account is active. You can now book rides with Romina Limousine Service.',
    },
    error: { title: 'Verification failed', sub: message },
  }[state];

  return (
    <AuthLayout title={copy.title} subtitle={copy.sub}>
      <div className="text-center">
        {state === 'verifying' && (
          <p className="text-sm text-muted">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent align-[-2px]" />{' '}
            Confirming your address…
          </p>
        )}

        {state === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <Link to="/login" className="block">
              <Button size="lg" className="w-full">
                Sign in
              </Button>
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-700">
              !
            </div>
            <Link to="/login" className="block">
              <Button size="lg" variant="outline" className="w-full">
                Back to sign in
              </Button>
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}