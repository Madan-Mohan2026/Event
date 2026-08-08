import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'super_admin' | 'admin' | 'staff';
    email?: string;
    assignedEvent?: string;
    assignedEventId?: string;
    assignedEventIds?: string[];
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_government_key_12345';

    jwt.verify(token, jwtSecret, (err: jwt.VerifyErrors | null, user: any) => {
      if (err) {
        res.status(401).json({ error: 'Token is invalid or expired.' });
        return;
      }
      req.user = user as AuthRequest['user'];
      next();
    });
  } else {
    res.status(401).json({ error: 'Authorization header missing or malformed.' });
  }
};

export const optionalAuthenticateJWT = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_government_key_12345';
    jwt.verify(token, jwtSecret, (_err: jwt.VerifyErrors | null, user: any) => {
      if (user) {
        req.user = user as AuthRequest['user'];
      }
      next();
    });
  } else {
    next();
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  next();
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'super_admin') {
    res.status(403).json({ error: 'Super Admin access required.' });
    return;
  }
  next();
};
