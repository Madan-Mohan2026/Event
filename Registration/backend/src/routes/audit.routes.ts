import { Router, Response } from 'express';
import { AuditLog } from '../models/auditLog.model';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT as any, async (_req: AuthRequest, res: Response) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 });
    res.status(200).json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch audit logs.' });
  }
});

export default router;
