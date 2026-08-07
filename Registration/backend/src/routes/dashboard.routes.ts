import { Router } from 'express';
import { getDashboardStats, getEventDashboardStats } from '../controllers/dashboard.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/stats', authenticateJWT as any, getDashboardStats as any);
router.get('/stats/:eventId', authenticateJWT as any, getEventDashboardStats as any);

export default router;
