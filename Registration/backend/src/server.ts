import app from './app';
import { connectDB } from './config/database';
import { ENV } from './config/env';

// Connect to MongoDB
connectDB();

const PORT = Number(ENV.PORT) || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server]: Server is running on 0.0.0.0:${PORT}`);
});

// Handle graceful shutdown
const gracefulShutdown = () => {
  console.log('Received kill signal, shutting down gracefully...');
  server.close(() => {
    console.log('Closed out remaining connections.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
