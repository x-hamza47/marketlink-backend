import { Router } from 'express';
import * as c from '../controllers/favoriteController.js';
import { verifyJWT } from '../middleware/auth.js';

const router = Router();
router.use(verifyJWT);

// Farmers
router.post('/farmer/:farmerId', c.toggleFavorite);
router.get('/farmer', c.listFavorites);

// Products
router.post('/product/:productId', c.toggleFavoriteProduct);
router.get('/product', c.listFavoriteProducts);

export default router;