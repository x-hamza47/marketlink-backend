import { Router } from 'express';
import * as c from '../controllers/orderController.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';

const router = Router();

// All order routes require authentication
router.use(verifyJWT);

// ─── Customer routes ───────────────────────────────────────
router.post('/', requireRole('customer'), c.create);
router.get('/my', requireRole('customer'), c.myOrders);
router.patch('/:id/cancel', requireRole('customer'), c.cancel);
router.patch('/:id/modify', requireRole('customer'), c.modify);

// ─── Farmer routes ─────────────────────────────────────────
router.get('/farmer', requireRole('farmer'), c.farmerOrders);
router.get('/farmer/insights', requireRole('farmer'), c.farmerInsights);
router.get('/farmer/recent', requireRole('farmer'), c.farmerRecentOrders);
router.get('/farmer/stats', requireRole('farmer'), c.farmerOrderStats);
router.get('/farmer/analytics', requireRole('farmer'), c.farmerAnalytics);
router.patch('/:id/status', requireRole('farmer'), c.updateStatus);

// ─── Shared (owner or admin) ───────────────────────────────
router.get('/:id', c.getOne);

export default router;