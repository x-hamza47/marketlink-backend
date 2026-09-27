import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import errorHandler from './middleware/error.js';

// ─── Junaid-owned routes (Backend A) ───────────────────────
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// ─── Noor-owned routes (Backend B) ─────────────────────────
import marketRoutes from './routes/marketRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();

// ─── Global middleware ─────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ─── Health check (public) ─────────────────────────────────
app.get('/api/health', (_, res) =>
  res.json({ success: true, data: 'ok', message: 'OK' })
);

// ─── Junaid routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);

// ⚠️ ORDER MATTERS: /api/admin must come BEFORE /api/admin/categories
app.use('/api/admin', adminRoutes);
app.use('/api/admin/categories', categoryRoutes);

// ─── Noor routes ───────────────────────────────────────────
app.use('/api/markets', marketRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);

// ─── 404 + error handler ───────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, error: 'Route not found' })
);
app.use(errorHandler);

export default app;