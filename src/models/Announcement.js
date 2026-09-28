import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title:      { type: String, required: true, trim: true },
    message:    { type: String, required: true },
     audience:   { type: String, enum: ['all', 'farmers', 'customers', 'admins'], default: 'all' },
    status:     { type: String, enum: ['draft', 'published'], default: 'draft' },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Announcement', announcementSchema);