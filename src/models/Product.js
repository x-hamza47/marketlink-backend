import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    farmerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'FarmerProfile', required: true },
    name:          { type: String, required: true, trim: true },
    category:      { type: String, required: true },
    description:   { type: String, default: '' },
    price:         { type: Number, required: true, min: 0 },
    unit:          { type: String, enum: ['kg','dozen','piece','litre','bunch'], required: true },
    stockQuantity: { type: Number, required: true, min: 0 },
    imageUrl:      { type: String, default: '' },
    isAvailable:   { type: Boolean, default: true },
    isTemplate:    { type: Boolean, default: false },
    weekOf:        { type: Date },
  },
  { timestamps: true }
);

productSchema.index({ farmerId: 1, isAvailable: 1 });
productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);