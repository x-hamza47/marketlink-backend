import { Router } from 'express';
import * as c from '../controllers/categoryController.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyJWT, requireRole('admin'));   // whole router admin-only
router.get('/', c.list);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

export default router;