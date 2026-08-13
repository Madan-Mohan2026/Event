import { Router } from 'express';
import { getPublicEvents, getPublicEventById, serveS3Banner, serveS3Agenda } from '../controllers/public.controller';

const router = Router();

// Public event routes (unauthenticated, public event read operations)
router.get('/events', getPublicEvents as any);
router.get('/events/:id', getPublicEventById as any);
router.get('/s3-banner/*', serveS3Banner as any);
router.get('/s3-agenda/*', serveS3Agenda as any);

export default router;
