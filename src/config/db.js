import mongoose from 'mongoose'
import { env } from './env.js'

mongoose.set('strictQuery', true)

let cached = global._mongoose
if (!cached) cached = global._mongoose = { conn: null, promise: null }

export default async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.mongoUri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => {
        console.log('✓ MongoDB connected')
        return m
      })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    cached.promise = null
    console.error('✗ MongoDB connection failed:', err.message)
    throw err
  }

  return cached.conn
}