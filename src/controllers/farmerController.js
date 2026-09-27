import FarmerProfile from '../models/FarmerProfile.js';
import Product from '../models/Product.js';
import Market from '../models/Market.js';
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
    .populate('markets.marketId', 'name address lat lng');;
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

export const getAvailableMarketsList = asyncHandler(async (req, res) => {
  const markets = await Market.find().select('_id name operatingDays timings').sort('name');
  return ok(res, markets.map((m) => ({
    id: m._id,
    name: m.name,
    operatingDays: m.operatingDays,
    timings: m.timings,
  })));
});

export const getMyStall = asyncHandler(async (req, res) => {
  const farmer = await FarmerProfile.findOne({ userId: req.user._id })
    .populate('markets.marketId', 'name address operatingDays timings');
  if (!farmer) return fail(res, 'Farmer profile missing', 400);

  return ok(res, {
    stallName: farmer.stallName,
    description: farmer.description || '',
    markets: farmer.markets.map((m) => ({
      id: m._id,
      marketId: m.marketId?._id || m.marketId,
      marketName: m.marketId?.name || '',
      operatingDays: m.operatingDays,
      pickupStart: m.pickupStart,
      pickupEnd: m.pickupEnd,
      cutoffHours: m.cutoffHours,
    })),
  });
});

export const updateMyStall = asyncHandler(async (req, res) => {
  const farmer = await FarmerProfile.findOne({ userId: req.user._id });
  if (!farmer) return fail(res, 'Farmer profile missing', 400);

  const { stallName, description, markets } = req.body;

  for (const fm of markets || []) {
    const market = await Market.findById(fm.marketId);
    if (!market) return fail(res, 'Market not found', 404);

    const invalidDays = fm.operatingDays.filter((d) => !market.operatingDays.includes(d));
    if (invalidDays.length > 0) {
      return fail(res, `Invalid operating days for ${market.name}: ${invalidDays.join(', ')}`);
    }
    if (fm.pickupStart < market.timings.open || fm.pickupEnd > market.timings.close) {
      return fail(res, `Pickup time for ${market.name} must be between ${market.timings.open} and ${market.timings.close}`);
    }
    if (fm.pickupStart >= fm.pickupEnd) {
      return fail(res, `Pickup start must be before pickup end for ${market.name}`);
    }
  }

  farmer.stallName = stallName;
  farmer.description = description || '';
  farmer.markets = (markets || []).map((m) => ({
    marketId: m.marketId,
    operatingDays: m.operatingDays,
    pickupStart: m.pickupStart,
    pickupEnd: m.pickupEnd,
    cutoffHours: Number(m.cutoffHours) || 2,
  }));

  await farmer.save();
  return ok(res, farmer, 'Stall profile updated');
});