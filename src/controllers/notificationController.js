import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const items = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 }).limit(50);
  return ok(res, items);
});

export const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true }, { new: true }
  );
  if (!n) return fail(res, 'Not found', 404);
  return ok(res, n, 'Marked read');
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  );
  return ok(res, null, 'All marked read');
});