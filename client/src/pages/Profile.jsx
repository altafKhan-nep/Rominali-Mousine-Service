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

  const formCard = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">Your profile</h1>
      <p className="mt-1 text-sm text-muted">Manage your personal details, photo and security.</p>

      {/* Avatar */}
      <div className={`${formCard} mt-6 flex flex-wrap items-center gap-6`}>
        <div className="relative">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="h-24 w-24 rounded-full border border-slate-200 object-cover shadow-sm"
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-full bg-brand-50 text-3xl font-bold text-brand-700">
              {user?.name?.[0]}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
            Upload photo
          </Button>
          {user?.avatar && (
            <Button variant="ghost" size="sm" onClick={deleteAvatar}>
              Remove
            </Button>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={onPickFile} />
        </div>
        <p className="w-full text-xs text-muted">PNG, JPG or WebP under 512KB. Stored securely on your account.</p>
      </div>

      {/* Personal details */}
      <form onSubmit={saveProfile} className={`${formCard} mt-6 space-y-4`}>
        <h2 className="font-bold">Personal details</h2>
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
      <form onSubmit={submitPassword} className={`${formCard} mt-6 space-y-4`}>
        <h2 className="font-bold">Change password</h2>
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={pw.currentPassword}
          onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            required
          />
        </div>
        <Button type="submit" loading={pwSaving}>Update password</Button>
      </form>

      {/* Notifications */}
      <div className={`${formCard} mt-6 flex items-center justify-between gap-4`}>
        <div>
          <h2 className="font-bold">Push notifications</h2>
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
  );
}
