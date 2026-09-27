import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone:        { type: String, required: true, trim: true },
    address:      { type: String, default: '' },
    role:         { type: String, enum: ['customer', 'farmer', 'admin'], default: 'customer' },
    isActive:     { type: Boolean, default: true },
    isApproved:   { type: Boolean, default: true },
    favorites:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'FarmerProfile' }],
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.model('User', userSchema);