import Order from '../models/Order.js';
import FarmerProfile from '../models/FarmerProfile.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, fail } from '../utils/response.js';
import { placeOrder } from '../services/orderService.js';
import { createNotification } from '../services/notificationService.js';
import { sendEmail } from '../services/emailService.js';

// ────────────────────────────────────────────────────────────
// CREATE — Customer places an order
// ────────────────────────────────────────────────────────────
export const create = asyncHandler(async (req, res) => {
  const order = await placeOrder({ customerId: req.user._id, ...req.body });
  return ok(res, order, 'Order placed', 201);
});

// ────────────────────────────────────────────────────────────
// MY ORDERS — Customer views own orders
// ────────────────────────────────────────────────────────────
export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customerId: req.user._id })
    .populate({ path: 'farmerId', select: 'stallName location' })
    .populate('marketId', 'name address')
    .sort('-createdAt');
  return ok(res, orders);
});

// ────────────────────────────────────────────────────────────
// FARMER ORDERS — Farmer views incoming orders
// ────────────────────────────────────────────────────────────
export const farmerOrders = asyncHandler(async (req, res) => {
  const farmer = await FarmerProfile.findOne({ userId: req.user._id });
  if (!farmer) return fail(res, 'Farmer profile missing', 400);

  const orders = await Order.find({ farmerId: farmer._id })
    .populate('customerId', 'name phone email')
    .sort('-createdAt');

  return ok(res, orders);
});

// ────────────────────────────────────────────────────────────
// FARMER INSIGHTS — Total / pending / revenue / top products
// ────────────────────────────────────────────────────────────
export const farmerInsights = asyncHandler(async (req, res) => {
  const farmer = await FarmerProfile.findOne({ userId: req.user._id });
  if (!farmer) return fail(res, 'Farmer profile missing', 400);

  const [total, pending, revenue, topProducts] = await Promise.all([
    Order.countDocuments({ farmerId: farmer._id }),
    Order.countDocuments({
      farmerId: farmer._id,
      status: { $in: ['placed', 'accepted', 'ready'] },
    }),
    Order.aggregate([
      { $match: { farmerId: farmer._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: { farmerId: farmer._id, status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          sold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 5 },
    ]),
  ]);

  return ok(res, {
    totalOrders: total,
    pendingOrders: pending,
    totalRevenue: revenue[0]?.total || 0,
    topProducts,
  });
});

// ────────────────────────────────────────────────────────────
// GET ONE — Customer / Farmer / Admin views a single order
// ────────────────────────────────────────────────────────────
export const getOne = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customerId', 'name phone email')
    .populate('farmerId', 'stallName userId location')
    .populate('marketId', 'name address');

  if (!order) return fail(res, 'Order not found', 404);

  const isOwner =
    order.customerId._id.toString() === req.user._id.toString() ||
    order.farmerId.userId.toString() === req.user._id.toString() ||
    req.user.role === 'admin';

  if (!isOwner) return fail(res, 'Forbidden', 403);
  return ok(res, order);
});

// ────────────────────────────────────────────────────────────
// UPDATE STATUS — Farmer accepts / declines / ready / completed
// ────────────────────────────────────────────────────────────
export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['accepted', 'declined', 'ready', 'completed'];
  if (!allowed.includes(status)) return fail(res, 'Invalid status');

  const farmer = await FarmerProfile.findOne({ userId: req.user._id });
  if (!farmer) return fail(res, 'Farmer profile missing', 400);

  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, farmerId: farmer._id },
    { status },
    { new: true }
  ).populate('customerId', 'name email');

  if (!order) return fail(res, 'Order not found', 404);

  // ─── Notification message map ────────────────────────────
  const msgMap = {
    accepted: 'Your order was accepted',
    declined: 'Your order was declined',
    ready: 'Your order is ready for pickup',
    completed: 'Order completed — please leave a review',
  };

  // ─── In-app notification ─────────────────────────────────
  await createNotification({
    userId: order.customerId._id,
    type: `order_${status}`,
    message: msgMap[status],
    link: `/orders/${order._id}`,
  });

  // ─── Email notification ──────────────────────────────────
  try {
    await sendEmail({
      to: order.customerId.email,
      subject: `MarketLink — Order ${status}`,
      html: `
        <h2>Hello ${order.customerId.name},</h2>
        <p>${msgMap[status]}</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Total:</strong> Rs. ${order.totalAmount}</p>
        <p><strong>Pickup:</strong> ${new Date(order.pickupDate).toDateString()},
          ${order.pickupWindow?.startTime || ''}–${order.pickupWindow?.endTime || ''}</p>
        <p>Thank you for using MarketLink!</p>
      `,
    });
  } catch (e) {
    console.error('Email send failed (non-blocking):', e.message);
  }

  return ok(res, order, 'Status updated');
});

// ────────────────────────────────────────────────────────────
// CANCEL — Customer cancels before cutoff
// ────────────────────────────────────────────────────────────
export const cancel = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    customerId: req.user._id,
  });
  if (!order) return fail(res, 'Order not found', 404);
  if (['completed', 'cancelled', 'declined'].includes(order.status))
    return fail(res, 'Cannot cancel this order');
  if (new Date() > order.cutoffTime) return fail(res, 'Cutoff has passed');

  order.status = 'cancelled';
  await order.save();

  // Restock products
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stockQuantity: item.quantity },
    });
  }

  const farmer = await FarmerProfile.findById(order.farmerId);
  await createNotification({
    userId: farmer.userId,
    type: 'order_cancelled',
    message: 'An order was cancelled',
    link: `/farmer/orders/${order._id}`,
  });

  return ok(res, order, 'Order cancelled');
});

// ────────────────────────────────────────────────────────────
// MODIFY — Customer modifies items before cutoff
// ────────────────────────────────────────────────────────────
export const modify = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    customerId: req.user._id,
  });
  if (!order) return fail(res, 'Order not found', 404);
  if (new Date() > order.cutoffTime) return fail(res, 'Cutoff has passed');
  if (!['placed', 'accepted'].includes(order.status))
    return fail(res, 'Cannot modify');

  const { items } = req.body;

  // Restock old items first
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stockQuantity: item.quantity },
    });
  }

  let total = 0;
  const snapshot = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || product.stockQuantity < item.quantity)
      return fail(res, 'Insufficient stock');

    // BUILD THE NEW SNAPSHOT (INCLUDING IMAGE)
    snapshot.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      unit: product.unit,
      imageUrl: product.imageUrl, // <--- ADDED THIS LINE
    });
    total += product.price * item.quantity;

    await Product.findByIdAndUpdate(product._id, {
      $inc: { stockQuantity: -item.quantity },
    });
  }

  order.items = snapshot;
  order.totalAmount = total;
  await order.save();

  return ok(res, order, 'Order updated');
});