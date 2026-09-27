import { Router } from 'express';
import * as c from '../controllers/productController.js';
import { verifyJWT, requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/', c.list);
router.post('/template', verifyJWT, requireRole('farmer'), c.createTemplate);
router.get('/mine/list', verifyJWT, requireRole('farmer'), c.myProducts);
router.get('/mine/stats', verifyJWT, requireRole('farmer'), c.myProductStats);
router.get('/:id', c.getOne);
router.post('/', verifyJWT, requireRole('farmer'), c.create);
router.put('/:id', verifyJWT, requireRole('farmer'), c.update);
router.delete('/:id', verifyJWT, requireRole('farmer'), c.remove);
router.patch('/:id/availability', verifyJWT, requireRole('farmer'), c.toggleAvailability);
router.get('/meta/categories', c.categories);

export default router;