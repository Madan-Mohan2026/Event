import dotenv from 'dotenv';
import path from 'path';

// Load from root .env first (works whether cwd is project root or backend/)
// Priority: backend/.env → ../../.env (root) → process.env (already set)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback: pick up any remaining process.env

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret_rtih_2026',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
