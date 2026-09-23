import { asyncHandler } from '../middleware/error.js';
import * as notificationService from '../services/notificationService.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ notifications: await notificationService.listNotifications(req.user._id) });
});

export const count = asyncHandler(async (req, res) => {
  res.json({ unread: await notificationService.unreadCount(req.user._id) });
});

export const markRead = asyncHandler(async (req, res) => {
  res.json(await notificationService.markRead(req.user._id, req.params.id));
});

export const markAllRead = asyncHandler(async (req, res) => {
  res.json(await notificationService.markAllRead(req.user._id));
});

export const subscribe = asyncHandler(async (req, res) => {
  res.json(await notificationService.subscribePush(req.user._id, req.body.subscription));
});

export const unsubscribe = asyncHandler(async (req, res) => {
  res.json(await notificationService.unsubscribePush(req.user._id, req.body.endpoint));
});
