import { Router } from 'express';
import * as c from '../controllers/aiController.js';
const router = Router();
router.post('/chat', c.ask);
export default router;


