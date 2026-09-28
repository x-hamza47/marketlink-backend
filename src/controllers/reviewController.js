import Review from '../models/Review.js';
import Order from '../models/Order.js';
import FarmerProfile from '../models/FarmerProfile.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';
import { recalcFarmerRating } from '../services/ratingService.js';
import { createNotification } from '../services/notificationService.js';

export const create = asyncHandler(async (req, res) => {
  const { orderId, rating, comment } = req.body;
  const order = await Order.findOne({ _id: orderId, customerId: req.user._id });
  if (!order) return fail(res, 'Order not found', 404);
  if (order.status !== 'completed') return fail(res, 'Order not completed');

  const existing = await Review.findOne({ orderId });
  if (existing) return fail(res, 'Already reviewed');

  const review = await Review.create({
    orderId,
    productId: order.items[0]?.productId,
    farmerId: order.farmerId,
    customerId: req.user._id,
    rating, comment: comment || '',
  });

  await recalcFarmerRating(order.farmerId);

  const farmer = await FarmerProfile.findById(order.farmerId);
  await createNotification({
    userId: farmer.userId,
    type: 'review_received',
    message: `New ${rating}★ review`,
    link: `/farmer/reviews`,
  });

  return ok(res, review, 'Review posted', 201);
});

export const byFarmer = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ farmerId: req.params.id, status: { $ne: 'hidden' } })
    .populate('customerId', 'name')
    .populate('productId', 'name')
    .sort('-createdAt');
  return ok(res, reviews);
});

export const byProduct = asyncHandler(async (req, res) => {
  const ordersWithProduct = await Order.find({ 'items.productId': req.params.id }).select('_id');
  const orderIds = ordersWithProduct.map(o => o._id);

  const reviews = await Review.find({
    $or: [
      { productId: req.params.id },
      { orderId: { $in: orderIds } },
    ],
    status: { $ne: 'hidden' },
  })
    .populate('customerId', 'name')
    .populate('productId', 'name')
    .sort('-createdAt');
  return ok(res, reviews);
});

export const respond = asyncHandler(async (req, res) => {
  const farmer = await FarmerProfile.findOne({ userId: req.user._id });
  const review = await Review.findOneAndUpdate(
    { _id: req.params.id, farmerId: farmer._id },
    { farmerResponse: req.body.response || '' },
    { new: true }
  );
  if (!review) return fail(res, 'Review not found', 404);
  return ok(res, review, 'Response added');
});

export const remove = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return fail(res, 'Not found', 404);
  await recalcFarmerRating(review.farmerId);
  return ok(res, null, 'Review removed');
});

// ────────────────────────────────────────────────────────────
// MY REVIEWS — Farmer views reviews on their own products
// ────────────────────────────────────────────────────────────
export const myReviews = asyncHandler(async (req, res) => {
  const farmer = await FarmerProfile.findOne({ userId: req.user._id });
  if (!farmer) return fail(res, 'Farmer profile missing', 400);

  const {
    search, rating, unansweredOnly,
    page = 1, limit = 10, sort = '-createdAt',
  } = req.query;

  const filter = { farmerId: farmer._id };
  if (rating) filter.rating = Number(rating);
  if (unansweredOnly === 'true') {
    filter.$or = [{ farmerResponse: { $exists: false } }, { farmerResponse: '' }];
  }

  let productIds = null;
  let customerIds = null;
  if (search) {
    const re = new RegExp(search, 'i');
    const Product = (await import('../models/Product.js')).default;
    const User = (await import('../models/User.js')).default;
    const [matchedProducts, matchedUsers] = await Promise.all([
      Product.find({ name: re }).select('_id'),
      User.find({ name: re }).select('_id'),
    ]);
    productIds = matchedProducts.map((p) => p._id);
    customerIds = matchedUsers.map((u) => u._id);
    filter.$or = [
      { productId: { $in: productIds } },
      { customerId: { $in: customerIds } },
    ];
  }

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('customerId', 'name')
      .populate('productId', 'name')
      .sort(`${sort} _id`)
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ]);

  const shaped = reviews.map((r) => ({
    id: r._id,
    customer: r.customerId?.name || 'Unknown',
    product: r.productId?.name || '',
    rating: r.rating,
    comment: r.comment,
    date: r.createdAt,
    response: r.farmerResponse || null,
  }));

  return ok(res, {
    items: shaped,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  });
});

// ────────────────────────────────────────────────────────────
// MY REVIEW STATS — Farmer's review summary
// ────────────────────────────────────────────────────────────
export const myReviewStats = asyncHandler(async (req, res) => {
  const farmer = await FarmerProfile.findOne({ userId: req.user._id });
  if (!farmer) return fail(res, 'Farmer profile missing', 400);

  const reviews = await Review.find({ farmerId: farmer._id });
  const total = reviews.length;
  const avgRating = total
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
    : 0;
  const unanswered = reviews.filter((r) => !r.farmerResponse).length;

  return ok(res, { total, avgRating, unanswered });
});