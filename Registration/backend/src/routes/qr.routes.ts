import { Router } from 'express';
import {
  getAdminQRCodes,
  getQRCode,
  regenerateQR,
  validateQR,
} from '../controllers/qr.controller';
import { authenticateJWT, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public endpoint — validate a token before login (no auth needed)
router.get('/validate', validateQR as any);

// All management routes below require Super Admin
router.post('/regenerate', authenticateJWT as any, requireSuperAdmin as any, regenerateQR as any);
router.get('/:adminId/:eventId', authenticateJWT as any, requireSuperAdmin as any, getQRCode as any);
router.get('/:adminId', authenticateJWT as any, requireSuperAdmin as any, getAdminQRCodes as any);

export default router;
