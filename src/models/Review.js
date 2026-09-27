import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    orderId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    productId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    farmerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'FarmerProfile', required: true },
    customerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating:         { type: Number, min: 1, max: 5, required: true },
    comment:        { type: String, default: '' },
    farmerResponse: { type: String, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ farmerId: 1 });

export default mongoose.model('Review', reviewSchema);