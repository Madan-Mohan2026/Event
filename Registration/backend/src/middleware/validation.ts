import { Request, Response, NextFunction } from 'express';

export const validateRequestBody = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.body) {
    res.status(400).json({ error: 'Request body is empty.' });
    return;
  }
  next();
};
