import { Router } from 'express';
import * as c from '../controllers/authController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = Router();
router.post('/register', c.register);
router.post('/register/farmer', c.registerFarmer);
router.post('/login', c.login);
router.get('/me', verifyJWT, c.me);
router.post('/logout', verifyJWT, (req, res) =>
  res.json({ success: true, data: null, message: 'Logged out' }));

export default router;