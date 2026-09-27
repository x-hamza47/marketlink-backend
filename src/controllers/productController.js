import Product from '../models/Product.js';
import FarmerProfile from '../models/FarmerProfile.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';

const getFarmerProfile = async (userId) => {
  const p = await FarmerProfile.findOne({ userId });
  if (!p) throw Object.assign(new Error('Farmer profile missing'), { status: 400 });
  return p;
};

export const list = asyncHandler(async (req, res) => {
  const {
    search, category, farmerId, marketId,
    minPrice, maxPrice, availableOnly,
    page = 1, limit = 20, sort = '-createdAt'
  } = req.query;

  const filter = {};
  if (search) {
    const re = new RegExp(search, 'i');
    filter.$or = [{ name: re }, { description: re }];
  }
  if (category) filter.category = category;
  if (farmerId) filter.farmerId = farmerId;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (availableOnly === 'true') filter.isAvailable = true;
  filter.isTemplate = false;

  if (marketId) {
    const farmers = await FarmerProfile.find({ 'markets.marketId': marketId }).select('_id');
    filter.farmerId = { $in: farmers.map(f => f._id) };
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate({ path: 'farmerId', populate: { path: 'userId', select: 'name' } })
      .sort(`${sort} _id`)   // <-- add _id as a tiebreaker, guarantees stable ordering
      .skip((page - 1) * limit).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  return ok(res, { items, total, page: Number(page), pages: Math.ceil(total / limit) });
});

export const getOne = asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id)
    .populate({ path: 'farmerId', populate: { path: 'userId', select: 'name' } });
  if (!p) return fail(res, 'Product not found', 404);
  return ok(res, p);
});

export const create = asyncHandler(async (req, res) => {
  const farmer = await getFarmerProfile(req.user._id);
  const product = await Product.create({ ...req.body, farmerId: farmer._id });
  return ok(res, product, 'Product created', 201);
});

export const update = asyncHandler(async (req, res) => {
  const farmer = await getFarmerProfile(req.user._id);
  const p = await Product.findOneAndUpdate(
    { _id: req.params.id, farmerId: farmer._id },
    req.body, { new: true }
  );
  if (!p) return fail(res, 'Product not found or not yours', 404);
  return ok(res, p, 'Product updated');
});

export const remove = asyncHandler(async (req, res) => {
  const farmer = await getFarmerProfile(req.user._id);
  const p = await Product.findOneAndDelete({
    _id: req.params.id, farmerId: farmer._id
  });
  if (!p) return fail(res, 'Product not found or not yours', 404);
  return ok(res, null, 'Product deleted');
});

export const toggleAvailability = asyncHandler(async (req, res) => {
  const farmer = await getFarmerProfile(req.user._id);
  const { isAvailable } = req.body;
  const p = await Product.findOneAndUpdate(
    { _id: req.params.id, farmerId: farmer._id },
    { isAvailable }, { new: true }
  );
  if (!p) return fail(res, 'Not found', 404);
  return ok(res, p, 'Availability updated');
});

export const createTemplate = asyncHandler(async (req, res) => {
  const farmer = await getFarmerProfile(req.user._id);
  const template = await Product.create({
    ...req.body, farmerId: farmer._id, isTemplate: true,
  });
  return ok(res, template, 'Template created', 201);
});

export const categories = asyncHandler(async (req, res) => {
  const cats = await Product.distinct('category', { isAvailable: true, isTemplate: false });
  return ok(res, cats);
});