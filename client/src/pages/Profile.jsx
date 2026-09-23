import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { updateProfile, setAvatar, removeAvatar, changePassword } from '../services/userService.js';
import { subscribePush, unsubscribePush } from '../services/notificationService.js';
import { getPublicSettings } from '../services/settingsService.js';

const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

// VAPID public key arrives as base64url; pushManager wants a Uint8Array.
const urlBase64ToUint8Array = (base64) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const fileRef = useRef(null);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [vapidKey, setVapidKey] = useState('');

  useEffect(() => {
    getPublicSettings()
      .then(({ data }) => setVapidKey(data.settings?.vapidPublicKey || ''))
      .catch(() => {});
  }, []);

  const applyUser = (u) => {
    setUser({ ...user, ...u });
    setName(u.name);
    setPhone(u.phone || '');
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setProfileError('');
    try {
      const { data } = await updateProfile({ name, phone });
      applyUser(data.user);
      setSaved(true);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      setProfileError('Image must be under 512KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const { data } = await setAvatar(reader.result);
        applyUser(data.user);
      } catch (err) {
        setProfileError(err.response?.data?.message || 'Could not upload image');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const deleteAvatar = async () => {
    const { data } = await removeAvatar();
    applyUser(data.user);
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    if (pw.newPassword !== pw.confirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setPwSaving(true);
    try {
      await changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwMsg({ type: 'success', text: 'Password updated' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Could not change password' });
    } finally {
      setPwSaving(false);
    }
  };

  const togglePush = async () => {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribePush(sub.endpoint);
          await sub.unsubscribe();
        }
        setPushEnabled(false);
      } else {
        if (!vapidKey) {
          setPwMsg({ type: 'error', text: 'Push notifications are not configured yet' });
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setPwMsg({ type: 'error', text: 'Notifications blocked in your browser settings' });
          return;
        }
        await navigator.serviceWorker.register('/sw.js');
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        await subscribePush(sub.toJSON());
        setPushEnabled(true);
        setPwMsg({ type: 'success', text: 'Push notifications enabled' });
      }
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Could not update push notifications' });
    } finally {
      setPushBusy(false);
    }
  };

  const formCard = 'card-lift rounded-3xl bg-white p-6 ring-1 ring-accent-200/60 sm:p-8';

  const roleLabel =
    user?.role === 'driver' ? 'Driver'
    : user?.role === 'admin' ? 'Admin'
    : 'Passenger';

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      {/* Header banner */}
      <div className="bg-brand-gradient relative overflow-hidden rounded-3xl px-6 py-10 text-white sm:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-10 h-56 w-56 rounded-full bg-gold-500/15 blur-3xl" />
        </div>
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="h-20 w-20 rounded-full object-cover shadow-lg ring-4 ring-white/25"
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white/15 text-3xl font-bold shadow-lg ring-4 ring-white/25 backdrop-blur">
                {user?.name?.[0]}
              </div>
            )}
            {user?.avatar && (
              <button
                type="button"
                onClick={deleteAvatar}
                aria-label="Remove photo"
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white text-brand-700 shadow transition-colors hover:bg-gold-300"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="eyebrow eyebrow-on-dark">Your account</span>
            <h1 className="mt-2 truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {user?.name || 'Your profile'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                {roleLabel}
              </span>
              {user?.email && (
                <span className="text-sm text-white/80">{user.email}</span>
              )}
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              Upload photo
            </Button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={onPickFile} />
      </div>

      <div className="mt-6 space-y-6">
        {/* Personal details */}
        <form onSubmit={saveProfile} className={`${formCard} space-y-4`}>
          <h2 className="text-lg font-bold">Personal details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Input label="Email" value={user?.email || ''} disabled className="sm:max-w-md" />
          {saved && <p className="text-sm font-medium text-brand-700">Saved</p>}
          {profileError && <p className="text-sm text-red-600">{profileError}</p>}
          <Button type="submit" loading={saving}>Save changes</Button>
        </form>

        {/* Change password */}
        <form onSubmit={submitPassword} className={`${formCard} space-y-4`}>
          <h2 className="text-lg font-bold">Change password</h2>
          <Input
            label="Current password"
            type="password"
            showToggle
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="New password"
              type="password"
              showToggle
              autoComplete="new-password"
              value={pw.newPassword}
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              showToggle
              autoComplete="new-password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              required
            />
          </div>
          <Button type="submit" loading={pwSaving}>Update password</Button>
        </form>

        {/* Notifications */}
        <div className={`${formCard} flex items-center justify-between gap-4`}>
          <div>
            <h2 className="text-lg font-bold">Push notifications</h2>
            <p className="mt-1 text-sm text-muted">
              Get ride and payment alerts in this browser.
            </p>
          </div>
          {isPushSupported ? (
            <Button variant={pushEnabled ? 'secondary' : 'primary'} loading={pushBusy} onClick={togglePush}>
              {pushEnabled ? 'Enabled' : 'Enable'}
            </Button>
          ) : (
            <p className="text-xs text-muted">Not supported in this browser</p>
          )}
        </div>
        {pwMsg.text && (
          <p className={`mt-2 text-sm ${pwMsg.type === 'success' ? 'font-medium text-brand-700' : 'text-red-600'}`}>
            {pwMsg.text}
          </p>
        )}
      </div>
    </div>
  );
}
