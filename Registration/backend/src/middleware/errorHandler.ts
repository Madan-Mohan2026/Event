import { Request, Response, NextFunction } from 'express';

export const globalErrorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  console.error('❌ [GLOBAL EXPRESS ERROR HANDLER]:', err.stack || err.message || err);
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ error: message, path: req.originalUrl });
};
