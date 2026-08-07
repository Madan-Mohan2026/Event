import { Request, Response, NextFunction } from 'express';

export const handleFileUpload = (_req: Request, _res: Response, next: NextFunction): void => {
  next();
};
