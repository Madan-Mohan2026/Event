import { Router } from 'express';
import { verifyParticipantMobile, markSelfAttendance } from '../controllers/attendance.controller';

const router = Router();

router.post('/:eventId/verify-mobile', verifyParticipantMobile as any);
router.post('/:id/mark-attendance', markSelfAttendance as any);

export default router;
