import mongoose from 'mongoose';
import { env } from './env.js';

export default async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    
    // Simple local connection
    await mongoose.connect(env.mongoUri);
    
    console.log('✓ MongoDB connected to Local Database');
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
}