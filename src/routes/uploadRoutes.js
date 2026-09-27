import { Router } from 'express';
import multer from 'multer';
import * as c from '../controllers/uploadController.js';
import { verifyJWT } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();
router.post('/image', verifyJWT, upload.single('file'), c.uploadImage);

export default router;