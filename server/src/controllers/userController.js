import { asyncHandler } from '../middleware/error.js';
import * as userService from '../services/userService.js';

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: await userService.getProfile(req.user._id) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  res.json({ user: await userService.updateProfile(req.user._id, req.body) });
});

export const setAvatar = asyncHandler(async (req, res) => {
  res.json({ user: await userService.setAvatar(req.user._id, req.body.dataUrl) });
});

export const removeAvatar = asyncHandler(async (req, res) => {
  res.json({ user: await userService.removeAvatar(req.user._id) });
});

export const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user._id, req.body);
  res.json({ success: true });
});
