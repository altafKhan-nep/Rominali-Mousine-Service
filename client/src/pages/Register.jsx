import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import SocialLoginButtons from '../components/auth/SocialLoginButtons.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'passenger',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // { email, verificationLink }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const data = await register(form);
      setDone({ email: form.email, verificationLink: data.verificationLink || '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const goHome = () => navigate(form.role === 'driver' ? '/driver' : '/', { replace: true });

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Account created</h1>
          <p className="mt-2 text-sm text-muted">
            We sent a verification link to <strong>{done.email}</strong>. Verify your email to
            activate your account.
          </p>
          {done.verificationLink && (
            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-left text-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Development verification link
              </p>
              <a
                href={done.verificationLink}
                className="break-all font-medium text-brand-700 underline"
              >
                {done.verificationLink}
              </a>
            </div>
          )}
          <Button onClick={goHome} size="lg" className="mt-6 w-full">
            Continue to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted">Join Romina Limousine Service in under a minute.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input label="Full name" required value={form.name} onChange={set('name')} />
          <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
          <Input label="Phone" value={form.phone} onChange={set('phone')} />
          <Input
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={set('password')}
          />

          <div>
            <span className="mb-2 block text-sm font-medium text-ink">I am a</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'passenger', label: 'Passenger' },
                { id: 'driver', label: 'Driver' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.id })}
                  className={`rounded-xl border p-3 text-sm font-semibold transition-colors ${
                    form.role === r.id
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
          <Button type="submit" size="lg" loading={loading} className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-4 rounded-xl bg-brand-50 px-4 py-2.5 text-center text-xs text-brand-700">
          A verification email will be sent to your inbox after sign-up.
        </p>

        <SocialLoginButtons />

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}