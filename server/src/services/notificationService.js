import webpush from 'web-push';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendMail } from './mailService.js';
import { sendSms } from './smsService.js';

// Web push is optional. VAPID keys live in .env (generate with
// `web-push generate-vapid-keys --json`). Without them, push is skipped.
const vapidConfigured =
  process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT;

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const isPushConfigured = () => vapidConfigured;

const appUrl = () => process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Central notifier: writes an in-app Notification row (persisted), and fans out
// to the user's live socket room + email/SMS/web-push when configured. `io` is
// optional so tests can call notify without a live socket server.
export const notify = async ({ user, type, title, message, data = {}, io }) => {
  const doc = await Notification.create({ user, type, title, message, data });

  if (io) io.to(`user:${String(user)}`).emit('notification:new', serialize(doc));

  // Fire-and-forget external channels (never fail the request on delivery).
  const recipient = await User.findById(user).select('email phone pushSubscriptions');
  if (!recipient) return doc;

  if (recipient.email) {
    sendMail({
      to: recipient.email,
      subject: title,
      html: `<p>${message || title}</p><p><a href="${appUrl()}">Open Romina Limousine Service</a></p>`,
    }).catch(() => {});
  }
  if (recipient.phone && type !== 'system') {
    sendSms({ to: recipient.phone, body: `${title} — ${message}` }).catch(() => {});
  }
  if (vapidConfigured && recipient.pushSubscriptions?.length) {
    const payload = JSON.stringify({ title, message, data });
    for (const sub of recipient.pushSubscriptions) {
      webpush
        .sendNotification(sub, payload)
        .catch(() => {});
    }
  }

  return doc;
};

export const serialize = (doc) => ({
  _id: doc._id,
  type: doc.type,
  title: doc.title,
  message: doc.message,
  data: doc.data,
  read: doc.read,
  createdAt: doc.createdAt,
});

export const listNotifications = async (userId) => {
  const docs = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50);
  return docs.map(serialize);
};

export const unreadCount = async (userId) =>
  Notification.countDocuments({ user: userId, read: false });

export const markRead = async (userId, id) => {
  await Notification.updateOne({ _id: id, user: userId }, { read: true, readAt: new Date() });
  return { success: true };
};

export const markAllRead = async (userId) => {
  await Notification.updateMany({ user: userId, read: false }, { read: true, readAt: new Date() });
  return { success: true };
};

// Web push subscription (browser -> server).
export const subscribePush = async (userId, subscription) => {
  if (!vapidConfigured) throw Object.assign(new Error('Push notifications are not configured'), { statusCode: 503 });
  if (!subscription?.endpoint) throw Object.assign(new Error('Invalid subscription'), { statusCode: 400 });

  const user = await User.findById(userId);
  const exists = user.pushSubscriptions.some((s) => s.endpoint === subscription.endpoint);
  if (!exists) {
    user.pushSubscriptions.push(subscription);
    await user.save();
  }
  return { success: true, enabled: true };
};

export const unsubscribePush = async (userId, endpoint) => {
  await User.findByIdAndUpdate(userId, {
    $pull: { pushSubscriptions: { endpoint } },
  });
  return { success: true, enabled: false };
};
