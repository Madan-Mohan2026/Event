import { Router } from 'express';
import {
  getAdminDashboard,
  getAdminActivityLogs,
  getMyEvents,
  getMyRegistrations,
  getMyCheckins,
  getMyFeedback,
  getMyReports,
  sendNotification,
  updateAdminProfile,
} from '../controllers/admin.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require JWT + admin role
router.use(authenticateJWT as any);
router.use(requireAdmin as any);

router.get('/dashboard', getAdminDashboard as any);
router.get('/activity-logs', getAdminActivityLogs as any);
router.get('/my-events', getMyEvents as any);
router.get('/registrations', getMyRegistrations as any);
router.get('/checkins', getMyCheckins as any);
router.get('/feedback', getMyFeedback as any);
router.get('/reports', getMyReports as any);
router.post('/notifications', sendNotification as any);
router.put('/profile', updateAdminProfile as any);

export default router;
