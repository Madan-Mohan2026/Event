import { Router } from 'express';
import { getGuests, createGuest, updateGuest, deleteGuest } from '../controllers/guest.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT as any, getGuests as any);
router.post('/', authenticateJWT as any, createGuest as any);
router.put('/:id', authenticateJWT as any, updateGuest as any);
router.delete('/:id', authenticateJWT as any, deleteGuest as any);

export default router;
