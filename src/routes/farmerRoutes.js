import { Router } from 'express';
import * as c from '../controllers/farmerController.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/', c.list);
router.get('/:id', c.getOne);
router.get('/:id/products', c.getProducts);
router.put('/profile', verifyJWT, requireRole('farmer'), c.updateProfile);

export default router;