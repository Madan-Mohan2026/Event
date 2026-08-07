import { Router } from 'express';
import { getForms, createForm, getFormById, updateForm, deleteForm } from '../controllers/form.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT as any, getForms as any);
router.post('/', authenticateJWT as any, createForm as any);
router.get('/:id', authenticateJWT as any, getFormById as any);
router.put('/:id', authenticateJWT as any, updateForm as any);
router.put('/:id/form-schema', authenticateJWT as any, updateForm as any);
router.delete('/:id', authenticateJWT as any, deleteForm as any);

export default router;
