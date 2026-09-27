import Review from '../models/Review.js';
import FarmerProfile from '../models/FarmerProfile.js';

export const recalcFarmerRating = async (farmerId) => {
  const agg = await Review.aggregate([
    { $match: { farmerId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = agg[0] || {};
  await FarmerProfile.findByIdAndUpdate(farmerId, {
    rating: Number(avg.toFixed(2)),
    totalReviews: count,
  });
};