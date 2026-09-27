import FarmerProfile from '../models/FarmerProfile.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.market) filter.markets = req.query.market;
  if (req.query.day) filter.operatingDays = req.query.day;
  const farmers = await FarmerProfile.find(filter)
    .populate('userId', 'name email phone');
  return ok(res, farmers);
});

export const getOne = asyncHandler(async (req, res) => {
  const farmer = await FarmerProfile.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('markets', 'name address lat lng');
  if (!farmer) return fail(res, 'Farmer not found', 404);
  return ok(res, farmer);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = req.body;
  if (updates.location?.lat && updates.location?.lng) {
    updates.location.coordinates = [updates.location.lng, updates.location.lat];
    updates.location.type = 'Point';
  }
  const farmer = await FarmerProfile.findOneAndUpdate(
    { userId: req.user._id }, updates, { new: true }
  );
  if (!farmer) return fail(res, 'Profile not found', 404);
  return ok(res, farmer, 'Profile updated');
});

export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    farmerId: req.params.id, isAvailable: true
  });
  return ok(res, products);
});