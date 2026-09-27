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
  const reviews = await Review.find({ farmerId: req.params.id })
    .populate('customerId', 'name')
    .sort('-createdAt');
  return ok(res, reviews);
});

export const byProduct = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.params.id })
    .populate('customerId', 'name')
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