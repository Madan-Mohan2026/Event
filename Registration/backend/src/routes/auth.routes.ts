import { Router } from 'express';
import { checkSetupStatus, setupSuperAdmin, login, getMe, qrLogin } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/status', checkSetupStatus);
router.post('/setup', setupSuperAdmin);
router.post('/login', login);
router.post('/qr-login', qrLogin);   // NEW – QR-authenticated login
router.get('/me', authenticateJWT as any, getMe as any);

export default router;
