import { Router } from 'express';
import * as c from '../controllers/marketController.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/', c.list);
router.get('/near', c.nearby);
router.get('/:id', c.getOne);
router.post('/', verifyJWT, requireRole('admin'), c.create);
router.put('/:id', verifyJWT, requireRole('admin'), c.update);
router.delete('/:id', verifyJWT, requireRole('admin'), c.remove);

export default router;