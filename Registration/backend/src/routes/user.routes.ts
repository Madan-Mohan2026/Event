import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  assignEvent,
  assignEvents,
} from '../controllers/user.controller';
import { authenticateJWT, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

// All user management routes require JWT + super admin
router.get('/', authenticateJWT as any, requireSuperAdmin as any, getUsers as any);
router.post('/', authenticateJWT as any, requireSuperAdmin as any, createUser as any);
router.patch('/:id/role', authenticateJWT as any, requireSuperAdmin as any, updateUserRole as any);
router.patch('/:id/status', authenticateJWT as any, requireSuperAdmin as any, toggleUserStatus as any);
router.delete('/:id', authenticateJWT as any, requireSuperAdmin as any, deleteUser as any);
router.patch('/:id/assign-event', authenticateJWT as any, requireSuperAdmin as any, assignEvent as any);
router.patch('/:id/assign-events', authenticateJWT as any, requireSuperAdmin as any, assignEvents as any);

export default router;

