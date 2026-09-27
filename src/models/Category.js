import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);