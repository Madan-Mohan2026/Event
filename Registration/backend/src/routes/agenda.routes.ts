import { Router } from 'express';
import { updateAgenda } from '../controllers/agenda.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.put('/:id/agenda', authenticateJWT as any, updateAgenda as any);

export default router;
