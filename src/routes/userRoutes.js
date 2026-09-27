import { Router } from 'express';
import * as c from '../controllers/userController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = Router();
router.use(verifyJWT);

router.get('/profile', c.getProfile);
router.put('/profile', c.updateProfile);
router.patch('/profile/password', c.changePassword);

export default router;