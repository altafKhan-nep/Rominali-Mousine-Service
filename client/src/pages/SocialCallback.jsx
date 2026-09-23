import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tokenStore } from '../services/api.js';
import { Spinner } from '../components/ui/Spinner.jsx';
import { Button } from '../components/ui/Button.jsx';
import AuthLayout from '../components/auth/AuthLayout.jsx';

// Landing page for the Passport OAuth callback. The server redirects here with
// fresh tokens in the query string (or ?error=... on failure). We store them
// and hard-redirect so the app reloads with AuthContext picking up the session.
const getQuery = (key) => {
  const match = window.location.search.match(new RegExp(`[?&]${key}=([^&]*)`));
  return match ? decodeURIComponent(match[1]) : '';
};

// Access JWTs embed { id, role, v } — decode the payload so the OAuth session is
// stored under the right per-role key (admin/driver/passenger).
const roleFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role || 'passenger';
  } catch {
    return 'passenger';
  }
};

export default function SocialCallback() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const error = getQuery('error');
    const access = getQuery('accessToken');
    const refresh = getQuery('refreshToken');

    if (error) {
      setStatus('error');
      return;
    }
    if (!access || !refresh) {
      setStatus('error');
      return;
    }
    tokenStore.setActiveRole(roleFromToken(access));
    tokenStore.setTokens(access, refresh);
    window.location.replace('/');
  }, []);

  const copy =
    status === 'loading'
      ? { title: 'Finishing sign-in…', sub: 'Connecting you to Romina Limousine Service.' }
      : { title: 'Sign-in failed', sub: "We couldn't log you in with that account. Please try again or use another method." };

  return (
    <AuthLayout title={copy.title} subtitle={copy.sub}>
      <div className="py-2 text-center">
        {status === 'loading' && (
          <div className="flex justify-center">
            <Spinner />
          </div>
        )}
        {status === 'error' && (
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-700">
            !
          </div>
        )}
        {status === 'error' && (
          <Link to="/login" className="block">
            <Button size="lg" variant="outline" className="w-full">
              Back to sign in
            </Button>
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}