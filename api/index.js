import app from '../src/app.js'
import connectDB from '../src/config/db.js'

export default async function handler(req, res) {
  try {
    await connectDB()
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: 'Database connection failed' })
  }
  return app(req, res)
}