import { Request, Response, NextFunction } from 'express';

/**
 * Development-only middleware to track execution time and payload size of Express API routes.
 * Automatically disabled in production.
 */
export const perfLogMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'production') {
    return next();
  }

  const startTime = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;

  // Intercept res.send to measure response size
  let contentLength = 0;
  const originalSend = res.send;

  res.send = function (body?: any): Response {
    if (body) {
      if (typeof body === 'string') {
        contentLength = Buffer.byteLength(body, 'utf8');
      } else if (Buffer.isBuffer(body)) {
        contentLength = body.length;
      } else {
        try {
          contentLength = Buffer.byteLength(JSON.stringify(body), 'utf8');
        } catch (e) {}
      }
    }
    return originalSend.apply(res, arguments as any);
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const sizeKB = (contentLength / 1024).toFixed(2);

    if (duration > 500) {
      console.warn(`[PERF LOG] 🔴 CRITICAL SLOW API REQUEST (${duration}ms > 500ms | ${sizeKB} KB): ${method} ${url} [Status: ${statusCode}]`);
    } else if (duration > 100) {
      console.warn(`[PERF LOG] ⚠️ SLOW API REQUEST (${duration}ms > 100ms | ${sizeKB} KB): ${method} ${url} [Status: ${statusCode}]`);
    } else {
      console.log(`[PERF LOG] ⚡ FAST API RESPONSE (${duration}ms | ${sizeKB} KB): ${method} ${url} [Status: ${statusCode}]`);
    }
  });

  next();
};
