import mongoose from 'mongoose';

const marketSchema = new mongoose.Schema(
  {
    marketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
      required: true,
    },

    operatingDays: [
      {
        type: String,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
    ],

    pickupStart: String,
    pickupEnd: String,
    cutoffHours: Number,
  },
  { _id: false }
);

const farmerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    stallName: {
      type: String,
      required: true,
      trim: true,
    },

    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
    },

    imageUrl: {
      type: String,
      default: '',
    },

    markets: [marketSchema],

    location: {
      address:     { type: String, default: '' },
      lat:         { type: Number, default: 0 },
      lng:         { type: Number, default: 0 },
      type:        { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },

    rating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

farmerProfileSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model('FarmerProfile', farmerProfileSchema);