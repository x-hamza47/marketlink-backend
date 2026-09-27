import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

export const getProfile = asyncHandler(async (req, res) => {
  return ok(res, req.user.toSafeObject());
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, imageUrl } = req.body;

  const updateData = { name, phone, address };
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true }
  ).select('-passwordHash');

  return ok(res, user, 'Profile updated');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return fail(res, 'Both passwords are required');

  const user = await User.findById(req.user._id);
  const match = await user.comparePassword(currentPassword);
  if (!match) return fail(res, 'Current password is incorrect', 401);

  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();

  return ok(res, null, 'Password changed successfully');
});