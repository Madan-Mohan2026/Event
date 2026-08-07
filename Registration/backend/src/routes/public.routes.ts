import { Router } from 'express';
import { getPublicEvents, getPublicEventById } from '../controllers/public.controller';

const router = Router();

// Public event routes (unauthenticated, public event read operations)
router.get('/events', getPublicEvents as any);
router.get('/events/:id', getPublicEventById as any);

export default router;
