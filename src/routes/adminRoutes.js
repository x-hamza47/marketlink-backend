import { Router } from 'express';
import * as c from '../controllers/adminController.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyJWT, requireRole('admin'));

router.get('/dashboard', c.dashboard);
router.get('/reports', c.reports);
router.get('/farmers/pending', c.pendingFarmers);
router.patch('/farmers/:id/approve', c.approveFarmer);
router.patch('/farmers/:id/suspend', c.suspendFarmer);
router.patch('/customers/:id/status', c.setCustomerStatus);
router.delete('/products/:id', c.removeProduct);

export default router;