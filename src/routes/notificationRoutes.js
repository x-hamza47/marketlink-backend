import { Router } from 'express';
import * as c from '../controllers/notificationController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = Router();
router.use(verifyJWT);

router.get('/', c.list);
router.patch('/:id/read', c.markRead);
router.patch('/read-all', c.markAllRead);

export default router;