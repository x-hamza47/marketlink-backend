import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: mongoose.Schema.Types.ObjectId,
    name:      String,
    price:     Number,
    quantity:  Number,
    unit:      String,
    imageUrl:  String, // <--- ADDED THIS LINE
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'FarmerProfile', required: true },
    marketId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Market' },
    items:       { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    pickupDate:  { type: Date, required: true },
    pickupWindow: {
      startTime: String,
      endTime:   String,
    },
    status: {
      type: String,
      enum: ['placed','accepted','declined','ready','completed','cancelled'],
      default: 'placed',
    },
    cutoffTime: { type: Date, required: true },
    notes:      { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1, status: 1 });
orderSchema.index({ farmerId: 1, status: 1 });

export default mongoose.model('Order', orderSchema);