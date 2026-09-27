import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

export const toggleFavorite = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const user = await User.findById(req.user._id);
  const idx = user.favorites.findIndex(f => f.toString() === farmerId);

  if (idx >= 0) {
    user.favorites.splice(idx, 1);
    await user.save();
    return ok(res, { favorited: false }, 'Removed from favorites');
  }
  user.favorites.push(farmerId);
  await user.save();
  return ok(res, { favorited: true }, 'Added to favorites');
});

export const listFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'favorites',
      populate: { path: 'userId', select: 'name email phone' }
    });
  return ok(res, user.favorites);
});


export const toggleFavoriteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);
  const idx = user.favoriteProducts.findIndex(p => p.toString() === productId);

  if (idx >= 0) {
    user.favoriteProducts.splice(idx, 1);
    await user.save();
    return ok(res, { favorited: false }, 'Removed from favorites');
  }
  user.favoriteProducts.push(productId);
  await user.save();
  return ok(res, { favorited: true }, 'Added to favorites');
});

export const listFavoriteProducts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'favoriteProducts',
      populate: { path: 'farmerId', populate: { path: 'userId', select: 'name' } }
    });
  return ok(res, user.favoriteProducts);
});