import { Router } from 'express';
import * as c from '../controllers/reviewController.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';

const router = Router();
router.post('/', verifyJWT, requireRole('customer'), c.create);
router.get('/mine/list', verifyJWT, requireRole('farmer'), c.myReviews);
router.get('/mine/stats', verifyJWT, requireRole('farmer'), c.myReviewStats);
router.get('/farmer/:id', c.byFarmer);
router.get('/product/:id', c.byProduct);
router.post('/:id/respond', verifyJWT, requireRole('farmer'), c.respond);
router.delete('/:id', verifyJWT, requireRole('admin'), c.remove);

export default router;