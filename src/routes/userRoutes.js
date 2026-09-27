import { Router } from 'express';
import * as c from '../controllers/userController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = Router();
router.use(verifyJWT);
router.put('/profile', c.updateProfile);

export default router;