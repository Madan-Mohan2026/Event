import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'super_admin') {
    res.status(403).json({ error: 'Access denied. Super Admin privileges required.' });
    return;
  }
  next();
};
