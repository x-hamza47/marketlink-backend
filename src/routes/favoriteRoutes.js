import { Router } from 'express';
import * as c from '../controllers/favoriteController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = Router();
router.use(verifyJWT);

router.post('/:farmerId', c.toggleFavorite);
router.get('/', c.listFavorites);

export default router;