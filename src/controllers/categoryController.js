import Category from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';

export const list = asyncHandler(async (req, res) =>
  ok(res, await Category.find().sort('-createdAt')));

export const create = asyncHandler(async (req, res) =>
  ok(res, await Category.create(req.body), 'Category created', 201));

export const update = asyncHandler(async (req, res) => {
  const c = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!c) return fail(res, 'Not found', 404);
  return ok(res, c, 'Updated');
});

export const remove = asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  return ok(res, null, 'Deleted');
});

export const stats = asyncHandler(async (req, res) => {
  const total = await Category.countDocuments();
  const active = await Category.countDocuments({ isActive: true });
  const inactive = total - active;
  return ok(res, { total, active, inactive });
});