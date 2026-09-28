import User from '../models/User.js';
import Market from '../models/Market.js';
import FarmerProfile from '../models/FarmerProfile.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';
import Notification from '../models/Notification.js';
import { createNotification } from '../services/notificationService.js';
import { recalcFarmerRating } from '../services/ratingService.js';
import Announcement from '../models/Announcement.js';


export const dashboard = asyncHandler(async (req, res) => {
  const [totalFarmers, totalCustomers, totalMarkets, totalOrders] = await Promise.all([
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'customer' }),
    Market.countDocuments(),
    Order.countDocuments(),
  ]);
  return ok(res, { totalFarmers, totalCustomers, totalMarkets, totalOrders });
});

export const pendingFarmers = asyncHandler(async (req, res) => {
  const list = await User.find({ role: 'farmer', isApproved: false })
    .select('name email phone createdAt');
  return ok(res, list);
});

export const approveFarmer = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id, { isApproved: true }, { new: true }
  ).select('-passwordHash');
  if (!user) return fail(res, 'Farmer not found', 404);
  return ok(res, user, 'Farmer approved');
});

export const suspendFarmer = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id, { isActive: false }, { new: true }
  ).select('-passwordHash');
  if (!user) return fail(res, 'Farmer not found', 404);
  return ok(res, user, 'Farmer suspended');
});

export const setCustomerStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id, { isActive }, { new: true }
  ).select('-passwordHash');
  if (!user) return fail(res, 'Customer not found', 404);
  return ok(res, user, 'Status updated');
});

export const getReportsSummary = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments({ status: 'completed' });
  const revenueAgg = await Order.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const activeMarkets = await Market.countDocuments();

  return ok(res, {
    totalOrders,
    totalRevenue: revenueAgg[0]?.total || 0,
    activeMarkets,
    trends: { totalOrders: 0, totalRevenue: 0, activeMarkets: 0 },
  });
});

export const getRevenueByMarket = asyncHandler(async (req, res) => {
  const data = await Order.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$marketId', orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    { $sort: { revenue: -1 } },
    { $lookup: { from: 'markets', localField: '_id', foreignField: '_id', as: 'market' } },
    { $unwind: '$market' },
    { $project: { marketId: '$_id', marketName: '$market.name', orders: 1, revenue: 1, _id: 0 } },
  ]);
  return ok(res, data);
});

export const getTopFarmers = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 5;

  const data = await Order.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$farmerId', orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    { $sort: { orders: -1 } },
    { $limit: limit },
    { $lookup: { from: 'farmerprofiles', localField: '_id', foreignField: '_id', as: 'farmer' } },
    { $unwind: '$farmer' },
    {
      $project: {
        farmerId: '$_id',
        name: '$farmer.contactPerson',
        stall: '$farmer.stallName',
        orders: 1,
        revenue: 1,
        _id: 0,
      },
    },
  ]);
  return ok(res, data);
});

export const removeProduct = asyncHandler(async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) return fail(res, 'Product not found', 404);
  return ok(res, null, 'Product removed by admin');
});
export const getAdminOrderStats = asyncHandler(async (req, res) => {
  const [total, pending, completed, revenueAgg] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: { $in: ['placed', 'accepted'] } }),
    Order.countDocuments({ status: 'completed' }),
    Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  return ok(res, {
    total,
    pending,
    completed,
    revenue: revenueAgg[0]?.total || 0,
  });
});

export const getOrderAnalytics = asyncHandler(async (req, res) => {
  const range = req.query.range || '7D';
  const daysMap = { '7D': 7, '30D': 30, '3M': 90, '12M': 365 };
  const days = daysMap[range] || 7;

  const since = new Date();
  since.setDate(since.getDate() - days);

  const raw = await Order.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const data = raw.map((r) => ({ label: r._id, orders: r.orders, revenue: r.revenue }));
  return ok(res, data);
});

export const getRecentOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('customerId', 'name')
    .populate('farmerId', 'stallName')
    .populate('marketId', 'name')
    .sort('-createdAt')
    .limit(50);

  const shaped = orders.map((o) => ({
    id: o._id,
    customer: o.customerId?.name || 'Unknown',
    farmer: o.farmerId?.stallName || 'Unknown',
    market: o.marketId?.name || '',
    items: o.items.length,
    total: o.totalAmount,
    pickupDate: o.pickupDate,
    status: o.status === 'ready' ? 'ready_for_pickup' : o.status,
  }));

  return ok(res, shaped);
});

export const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const STATUS_MAP = { ready_for_pickup: 'ready' };
  const status = STATUS_MAP[req.body.status] || req.body.status;

  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) return fail(res, 'Order not found', 404);
  return ok(res, order, 'Order updated');
});

export const adminDeleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return fail(res, 'Order not found', 404);
  return ok(res, null, 'Order deleted');
});

export const getOverviewStats = asyncHandler(async (req, res) => {
  const [
    totalFarmers,
    totalCustomers,
    totalMarkets,
    totalOrders,
    pendingFarmerApprovals,
    activeProducts,
    readyForPickup,
    reviewsAwaitingModeration,
  ] = await Promise.all([
    User.countDocuments({ role: 'farmer', isApproved: true }),
    User.countDocuments({ role: 'customer' }),
    Market.countDocuments(),
    Order.countDocuments(),
    User.countDocuments({ role: 'farmer', isApproved: false }),
    Product.countDocuments({ isAvailable: true, isTemplate: false }),
    Order.countDocuments({ status: 'ready' }),
    Review.countDocuments({ farmerResponse: { $in: [null, ''] } }),
  ]);

  return ok(res, {
    totalFarmers,
    totalCustomers,
    totalMarkets,
    totalOrders,
    pendingFarmerApprovals,
    activeProducts,
    readyForPickup,
    reviewsAwaitingModeration,
    trends: {
      totalFarmers: 0,
      totalCustomers: 0,
      totalMarkets: 0,
      totalOrders: 0,
      pendingFarmerApprovals: 0,
      activeProducts: 0,
      readyForPickup: 0,
      reviewsAwaitingModeration: 0,
    },
  });
});
function deriveFarmerStatus(user) {
  if (!user.isApproved) return 'pending';
  if (!user.isActive) return 'suspended';
  return 'approved';
}

export const getFarmers = asyncHandler(async (req, res) => {
  const farmers = await User.find({ role: 'farmer' })
    .select('name email phone isApproved isActive createdAt')
    .sort('-createdAt');

  const profiles = await FarmerProfile.find({
    userId: { $in: farmers.map((f) => f._id) },
  }).select('userId stallName markets');

  const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));

  const shaped = farmers.map((f) => {
    const profile = profileMap.get(String(f._id));
    return {
      id: f._id,
      name: f.name,
      stall: profile?.stallName || '—',
      markets: profile?.markets?.length || 0,
      registered: f.createdAt,
      status: deriveFarmerStatus(f),
    };
  });

  return ok(res, shaped);
});

export const updateFarmerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'approved' | 'suspended' | 'pending'
  const update =
    status === 'approved' ? { isApproved: true, isActive: true }
      : status === 'suspended' ? { isApproved: true, isActive: false }
        : { isApproved: false };

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'farmer' },
    update,
    { new: true }
  ).select('-passwordHash');

  if (!user) return fail(res, 'Farmer not found', 404);

  const NOTIF_COPY = {
    approved: 'Your farmer account was approved — you can now list products and start selling.',
    suspended: 'Your farmer account was suspended. Contact support if you believe this is a mistake.',
    pending: 'Your farmer account was moved back to pending review.',
  };
  const message = NOTIF_COPY[status];
  if (message) {
    await Notification.create({
      userId: user._id,
      type: 'farmer_status',
      message,
      link: '/farmer/profile',
    });
  }
  return ok(res, { id: user._id, status: deriveFarmerStatus(user) }, 'Farmer status updated');
});

export const deleteFarmerUser = asyncHandler(async (req, res) => {
  const user = await User.findOneAndDelete({ _id: req.params.id, role: 'farmer' });
  if (!user) return fail(res, 'Farmer not found', 404);
  await FarmerProfile.findOneAndDelete({ userId: req.params.id });
  return ok(res, null, 'Farmer removed');
});


// Customers
export const getCustomers = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: 'customer' })
    .select('name email phone isActive createdAt')
    .sort('-createdAt');

  const orderCounts = await Order.aggregate([
    { $group: { _id: '$customerId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(orderCounts.map((o) => [String(o._id), o.count]));

  const shaped = customers.map((c) => ({
    id: c._id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    orders: countMap.get(String(c._id)) || 0,
    status: c.isActive ? 'active' : 'inactive',
    joined: c.createdAt,
  }));

  return ok(res, shaped);
});

export const getCustomerStats = asyncHandler(async (req, res) => {
  const total = await User.countDocuments({ role: 'customer' });
  const active = await User.countDocuments({ role: 'customer', isActive: true });
  const inactive = total - active;
  const totalOrders = await Order.countDocuments();
  return ok(res, { total, active, inactive, totalOrders });
});

export const updateCustomerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'active' | 'inactive'
  const isActive = status === 'active';

  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'customer' },
    { isActive },
    { new: true }
  ).select('-passwordHash');

  if (!user) return fail(res, 'Customer not found', 404);

  const message = isActive
    ? 'Your account has been reactivated.'
    : 'Your account has been deactivated. Contact support if you believe this is a mistake.';

  await Notification.create({
    userId: user._id,
    type: 'customer_status',
    message,
  });

  return ok(res, { id: user._id, status }, 'Customer status updated');
});

export const deleteCustomerUser = asyncHandler(async (req, res) => {
  const user = await User.findOneAndDelete({ _id: req.params.id, role: 'customer' });
  if (!user) return fail(res, 'Customer not found', 404);
  return ok(res, null, 'Customer removed');
});


// Products
export const updateProductModeration = asyncHandler(async (req, res) => {
  const { moderation } = req.body; // 'approved' | 'rejected'

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { moderation },
    { new: true }
  ).populate({ path: 'farmerId', select: 'userId stallName' });

  if (!product) return fail(res, 'Product not found', 404);

  if (moderation === 'rejected' && product.farmerId?.userId) {
    await Notification.create({
      userId: product.farmerId.userId,
      type: 'product_moderation',
      message: `Your product "${product.name}" was rejected by an admin and is no longer visible to customers.`,
      link: '/farmer/products',
    });
  }

  return ok(res, { id: product._id, moderation }, 'Product moderation updated');
});
export const getAdminProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isTemplate: false })
    .populate({ path: 'farmerId', select: 'stallName' })
    .sort('-createdAt');

  const shaped = products.map((p) => ({
    id: p._id,
    name: p.name,
    farmer: p.farmerId?.stallName || 'Unknown',
    category: p.category,
    price: p.price,
    unit: p.unit,
    stock: p.stockQuantity,
    availability: !p.isAvailable
      ? 'unavailable'
      : p.stockQuantity <= 5
        ? 'low_stock'
        : 'available',
    moderation: p.moderation,
  }));

  return ok(res, shaped);
});

export const getAdminProductStats = asyncHandler(async (req, res) => {
  const total = await Product.countDocuments({ isTemplate: false });
  const available = await Product.countDocuments({ isTemplate: false, isAvailable: true, stockQuantity: { $gt: 5 } });
  const lowStock = await Product.countDocuments({ isTemplate: false, isAvailable: true, stockQuantity: { $gt: 0, $lte: 5 } });
  const pendingModeration = await Product.countDocuments({ isTemplate: false, moderation: 'pending' });
  return ok(res, { total, available, lowStock, pendingModeration });
});

//Reviews
export const getAdminReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('customerId', 'name')
    .populate('productId', 'name')
    .populate({ path: 'farmerId', select: 'stallName' })
    .sort('-createdAt');

  const shaped = reviews.map((r) => ({
    id: r._id,
    customer: r.customerId?.name || 'Unknown',
    product: r.productId?.name || '',
    farmer: r.farmerId?.stallName || 'Unknown',
    rating: r.rating,
    comment: r.comment,
    date: r.createdAt,
    status: r.status,
  }));

  return ok(res, shaped);
});

export const getAdminReviewStats = asyncHandler(async (req, res) => {
  const reviews = await Review.find().select('rating status');
  const total = reviews.length;
  const flagged = reviews.filter((r) => r.status === 'flagged').length;
  const hidden = reviews.filter((r) => r.status === 'hidden').length;
  const visible = reviews.filter((r) => r.status !== 'hidden').length;
  const avgRating = total
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
    : 0;
  return ok(res, { total, flagged, visible, hidden, avgRating });
});

export const updateReviewStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'visible' | 'flagged' | 'hidden'

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate('customerId', 'name');

  if (!review) return fail(res, 'Review not found', 404);

  if (status === 'hidden') {
    await createNotification({
      userId: review.customerId._id,
      type: 'review_moderation',
      message: 'One of your reviews was removed for violating community guidelines.',
      link: '/orders',
    });
  }

  return ok(res, { id: review._id, status }, 'Review status updated');
});

export const deleteAdminReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return fail(res, 'Review not found', 404);
  await recalcFarmerRating(review.farmerId);
  return ok(res, null, 'Review deleted');
});


/// Announcements
async function notifyAudience(announcement) {
  const roleFilter =
    announcement.audience === 'farmers' ? { role: 'farmer' }
    : announcement.audience === 'customers' ? { role: 'customer' }
    : announcement.audience === 'admins' ? { role: 'admin' }
    : { role: { $in: ['farmer', 'customer'] } };

  const users = await User.find(roleFilter).select('_id');
  await Notification.insertMany(
    users.map((u) => ({
      userId: u._id,
      type: 'announcement',
      message: announcement.title,
      link: '/announcements',
    }))
  );
}
export const getAnnouncements = asyncHandler(async (req, res) => {
  const items = await Announcement.find().populate('createdBy', 'name').sort('-createdAt');
  const shaped = items.map((a) => ({
    id: a._id,
    title: a.title,
    message: a.message,
    audience: a.audience,
    status: a.status,
    createdBy: a.createdBy?.name || 'Admin',
    createdAt: a.createdAt,
    expiresAt: a.expiresAt,
  }));
  return ok(res, shaped);
});

export const getAnnouncementStats = asyncHandler(async (req, res) => {
  const total = await Announcement.countDocuments();
  const published = await Announcement.countDocuments({ status: 'published' });
  const drafts = total - published;
  return ok(res, { total, published, drafts });
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, audience, status, expiresAt } = req.body;
  const announcement = await Announcement.create({
    title, message, audience, status: status || 'draft',
    expiresAt: expiresAt || null,
    createdBy: req.user._id,
  });

  if (announcement.status === 'published') {
    await notifyAudience(announcement);
  }

  return ok(res, announcement, 'Announcement created', 201);
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!announcement) return fail(res, 'Not found', 404);
  return ok(res, announcement, 'Announcement updated');
});

export const updateAnnouncementStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; 
  const announcement = await Announcement.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!announcement) return fail(res, 'Not found', 404);

  if (status === 'published') {
    await notifyAudience(announcement);
  }

  return ok(res, { id: announcement._id, status }, 'Status updated');
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) return fail(res, 'Not found', 404);
  return ok(res, null, 'Announcement deleted');
});

export const getAdminMarkets = asyncHandler(async (req, res) => {
  const markets = await Market.find().sort('-createdAt');

  const farmerCounts = await FarmerProfile.aggregate([
    { $unwind: '$markets' },
    { $group: { _id: '$markets.marketId', count: { $sum: 1 } } },
  ]);
  const farmerCountMap = new Map(farmerCounts.map((f) => [String(f._id), f.count]));

  const productCounts = await Product.aggregate([
    { $match: { isTemplate: false } },
    { $lookup: { from: 'farmerprofiles', localField: 'farmerId', foreignField: '_id', as: 'farmer' } },
    { $unwind: '$farmer' },
    { $unwind: '$farmer.markets' },
    { $group: { _id: '$farmer.markets.marketId', count: { $sum: 1 } } },
  ]);
  const productCountMap = new Map(productCounts.map((p) => [String(p._id), p.count]));

  const shaped = markets.map((m) => ({
    id: m._id,
    name: m.name,
    address: m.address,
    operatingDays: m.operatingDays,
    lat: m.lat,
    lng: m.lng,
    farmers: farmerCountMap.get(String(m._id)) || 0,
    products: productCountMap.get(String(m._id)) || 0,
    status: m.isActive ? 'active' : 'inactive',
  }));

  return ok(res, shaped);
});

export const getAdminMarketStats = asyncHandler(async (req, res) => {
  const total = await Market.countDocuments();
  const active = await Market.countDocuments({ isActive: true });
  const totalFarmers = await FarmerProfile.countDocuments();
  const totalProducts = await Product.countDocuments({ isTemplate: false });
  return ok(res, { total, active, totalFarmers, totalProducts });
});

export const updateMarketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'active' | 'inactive'
  const market = await Market.findByIdAndUpdate(
    req.params.id,
    { isActive: status === 'active' },
    { new: true }
  );
  if (!market) return fail(res, 'Market not found', 404);
  return ok(res, { id: market._id, status }, 'Market status updated');
});