import { useState } from 'react';
import { API_ROOT } from '../../services/api.js';

// Real-world style "Continue with" options. Google/Facebook use the Passport
// OAuth redirect flow — they link to the server when credentials are set, or
// show a friendly notice so the UI is always visible.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '';

const googleReady = Boolean(GOOGLE_CLIENT_ID);
const facebookReady = Boolean(FACEBOOK_APP_ID);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877f2" aria-hidden="true">
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.55-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
  </svg>
);

const buttonBase =
  'flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-slate-50';

export default function SocialLoginButtons() {
  const [notice, setNotice] = useState('');

  const notReady = (provider) =>
    setNotice(`${provider} sign-in isn't connected yet. It will work once the app owner adds the OAuth credentials.`);

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-slate-200" />
        or continue with
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {notice && (
        <p className="mt-3 rounded-xl bg-gold-50 px-4 py-2.5 text-xs text-ink">{notice}</p>
      )}

      <div className="mt-4 space-y-3">
        {googleReady ? (
          <a href={`${API_ROOT}/api/auth/google`} className={buttonBase}>
            <GoogleIcon /> Continue with Google
          </a>
        ) : (
          <button type="button" onClick={() => notReady('Google')} className={buttonBase}>
            <GoogleIcon /> Continue with Google
          </button>
        )}

        {facebookReady ? (
          <a href={`${API_ROOT}/api/auth/facebook`} className={buttonBase}>
            <FacebookIcon /> Continue with Facebook
          </a>
        ) : (
          <button type="button" onClick={() => notReady('Facebook')} className={buttonBase}>
            <FacebookIcon /> Continue with Facebook
          </button>
        )}
      </div>
    </div>
  );
}