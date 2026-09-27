import Product from '../models/Product.js';
import Order from '../models/Order.js';
import FarmerProfile from '../models/FarmerProfile.js';
import { createNotification } from './notificationService.js';

export const placeOrder = async ({ customerId, farmerId, marketId, items, pickupDate, notes }) => {
  const farmer = await FarmerProfile.findById(farmerId);
  if (!farmer) throw Object.assign(new Error('Farmer not found'), { status: 404 });

  const snapshot = [];
  let total = 0;
  for (const item of items) {
    const product = await Product.findOne({ _id: item.productId, farmerId });
    if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });
    if (!product.isAvailable) throw Object.assign(new Error(`${product.name} unavailable`), { status: 400 });
    if (product.stockQuantity < item.quantity)
      throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { status: 400 });

    snapshot.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      unit: product.unit,
      imageUrl: product.imageUrl,
    });
    total += product.price * item.quantity;
  }

  // Find this farmer's entry for the chosen market
  const marketEntry = farmer.markets.find(
    (m) => m.marketId.toString() === marketId.toString()
  );
  if (!marketEntry) throw Object.assign(new Error('Farmer does not sell at this market'), { status: 400 });

  const dayName = new Date(pickupDate).toLocaleDateString('en-US', { weekday: 'short' });
  if (!marketEntry.operatingDays.includes(dayName)) {
    throw Object.assign(new Error('Farmer is not available at this market on the selected day'), { status: 400 });
  }

  const pickupWindow = {
    startTime: marketEntry.pickupStart,
    endTime: marketEntry.pickupEnd,
  };

  const cutoffHours = marketEntry.cutoffHours ?? 12;
  const cutoff = new Date(new Date(pickupDate).getTime() - cutoffHours * 60 * 60 * 1000);
  if (new Date() > cutoff) throw Object.assign(new Error('Cutoff has passed'), { status: 400 });

  const order = await Order.create({
    customerId, farmerId, marketId,
    items: snapshot, totalAmount: total,
    pickupDate, pickupWindow,
    cutoffTime: cutoff, notes: notes || '',
  });

  for (const item of items) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: -item.quantity } });
  }

  await createNotification({
    userId: farmer.userId,
    type: 'order_placed',
    message: `New order #${order._id.toString().slice(-6)} placed`,
    link: `/farmer/orders/${order._id}`,
  });

  return order;
};