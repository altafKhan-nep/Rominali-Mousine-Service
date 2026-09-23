import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, CreditCard, Lock, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  listNotifications,
  unreadCount as fetchUnread,
  markAllRead,
  markRead,
} from '../../services/notificationService.js';
import { onNotification, offNotification } from '../../services/socketService.js';

const TYPE_ICON = {
  ride: Car,
  payment: CreditCard,
  account: Lock,
  system: Bell,
};

const dataUrl = (n) => {
  if (n.data?.rideId) return `/rides/track/${n.data.rideId}`;
  if (n.data?.paymentId) return '/profile';
  return null;
};

export default function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const refresh = async () => {
    try {
      const [list, count] = await Promise.all([listNotifications(), fetchUnread()]);
      setItems(list.data.notifications);
      setUnread(count.data.unread);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!user) return;
    refresh();
    const cb = (n) => {
      setUnread((u) => u + 1);
      setItems((prev) => [n, ...prev].slice(0, 50));
    };
    onNotification(cb);
    return () => offNotification();
  }, [user]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const openItem = async (n) => {
    if (!n.read) {
      await markRead(n._id).catch(() => {});
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
    const url = dataUrl(n);
    if (url) navigate(url);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) refresh();
        }}
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-full text-white transition-colors hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-brand-950">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[9999] mt-2 w-80 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button
                onClick={async () => {
                  await markAllRead().catch(() => {});
                  setUnread(0);
                  setItems((prev) => prev.map((x) => ({ ...x, read: true })));
                }}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">No notifications yet</p>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => openItem(n)}
                  className={`flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50 ${
                    n.read ? 'opacity-70' : ''
                  }`}
                >
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700" aria-hidden="true">
                    {(() => {
                      const Icon = TYPE_ICON[n.type] || Bell;
                      return <Icon className="h-4 w-4" />;
                    })()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{n.title}</span>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{n.message}</span>
                    <span className="mt-1 block text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
