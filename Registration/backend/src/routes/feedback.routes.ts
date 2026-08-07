import { Router } from 'express';
import { submitPublicFeedback, dispatchFeedbackForm } from '../controllers/feedback.controller';

const router = Router();

router.post('/public', submitPublicFeedback as any);
router.post('/dispatch', dispatchFeedbackForm as any);

export default router;
