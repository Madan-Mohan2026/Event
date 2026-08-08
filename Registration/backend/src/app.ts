import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';

// Import Route Handlers
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import registrationRoutes from './routes/registration.routes';
import dashboardRoutes from './routes/dashboard.routes';
import auditRoutes from './routes/audit.routes';
import guestRoutes from './routes/guest.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import formRoutes from './routes/form.routes';
import qrRoutes from './routes/qr.routes';
import publicRoutes from './routes/public.routes';
import { realtimeStreamHandler } from './services/realtime.service';

import { scanKit, scanFood } from './controllers/registration.controller';

import { perfLogMiddleware } from './middleware/perfLog.middleware';

import { getLocalIpAddress, getAccessibleHostUrl } from './utils/qr.utils';

const app: Application = express();

// Standard Middleware
const getCorsOrigins = () => {
  const envOrigins = [
    process.env.FRONTEND_URL,
    process.env.PUBLIC_APP_URL,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
  ].filter(Boolean).map(url => (url as string).trim().replace(/\/$/, ''));

  const localOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ];

  return { envOrigins, allAllowed: [...localOrigins, ...envOrigins] };
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    const { envOrigins, allAllowed } = getCorsOrigins();

    if (allAllowed.includes(cleanOrigin)) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== 'production' && envOrigins.length === 0) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${cleanOrigin}`));
  },
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(perfLogMiddleware);

// Serve physical static files (e.g. uploaded event banners)
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Basic Health Check Route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// Server IP & LAN Host URL Config endpoint for QR generation
app.get('/api/config/server-ip', (req: Request, res: Response) => {
  const localIp = getLocalIpAddress();
  const hostUrl = getAccessibleHostUrl(req);
  res.status(200).json({ success: true, localIp, hostUrl });
});

// Server-Sent Events (SSE) Stream for Real-Time Sync
app.get('/api/realtime/stream', realtimeStreamHandler);

// Top-level direct QR scanning endpoints
app.post('/api/scan-kit', scanKit as any);
app.post('/api/scan-food', scanFood as any);
app.post('/api/verify-kit', scanKit as any);
app.post('/api/verify-food', scanFood as any);

// Mount Routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/qr', qrRoutes);

// Catch-all route handler for 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ [GLOBAL EXPRESS ERROR HANDLER]:', err.stack || err.message || err);
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ error: message, path: req.originalUrl });
});

export default app;
