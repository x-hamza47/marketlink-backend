import mongoose from 'mongoose';

const marketSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    mapProvider: { type: String, enum: ['osm', 'google'], default: 'osm' },
    operatingDays: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
    timings: {
      open: { type: String, default: '06:00' },
      close: { type: String, default: '18:00' },
    },
    isActive: { type: Boolean, default: true },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

marketSchema.index({ location: '2dsphere' });

export default mongoose.model('Market', marketSchema);