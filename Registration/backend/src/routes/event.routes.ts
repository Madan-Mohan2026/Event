import { Router } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateFormSchema,
  updateAgenda,
  regenerateEventQr
} from '../controllers/event.controller';
import { authenticateJWT, optionalAuthenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public & Admin routes (reads request user context optionally)
router.get('/', optionalAuthenticateJWT as any, getEvents as any);
router.get('/:id', optionalAuthenticateJWT as any, getEventById as any);

// Admin & Super Admin event operations
router.post('/', authenticateJWT as any, requireAdmin as any, createEvent as any);
router.put('/:id', authenticateJWT as any, updateEvent as any);
router.delete('/:id', authenticateJWT as any, requireAdmin as any, deleteEvent as any);
router.put('/:id/form-schema', authenticateJWT as any, updateFormSchema as any);
router.put('/:id/agenda', authenticateJWT as any, updateAgenda as any);
router.post('/:id/regenerate-qr', authenticateJWT as any, regenerateEventQr as any);

export default router;
