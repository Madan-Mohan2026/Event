import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

// Ensure root .env is loaded regardless of which directory ts-node-dev runs from
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

// Fix Windows Node.js DNS resolution issues for MongoDB Atlas SRV records (_mongodb._tcp...)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if custom DNS cannot be set in environment
}

import { migrateBase64BannersToFiles } from '../services/bannerStorage.service';

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test';

  // Log which URI is being used (masked password) to aid debugging
  const uriForLog = mongoURI.includes('@')
    ? mongoURI.replace(/:([^:@]+)@/, ':***@')
    : mongoURI;
  console.log(`[db]: Connecting to MongoDB → ${uriForLog}`);

  try {
    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 50,
      minPoolSize: 10,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 15000,
      retryWrites: true,
    } as any);
    console.log(`[db]: ✅ Connected → Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
    
    // Automatically migrate legacy Base64 banner images to physical disk files
    migrateBase64BannersToFiles().catch(err => {
      console.error('[db]: Banner migration background error:', err);
    });
  } catch (error: any) {
    console.error('[db]: ❌ Primary MongoDB connection failed:', error.message);

    // If Atlas SRV DNS fails and fallback to local MongoDB is available
    if (mongoURI.includes('mongodb+srv://')) {
      console.log('[db]: 🔄 Attempting fallback connection...');
    }

    try {
      // Attempt local fallback if Atlas DNS fails
      const fallbackURI = 'mongodb://127.0.0.1:27017/test';
      console.log(`[db]: Connecting to local fallback MongoDB → ${fallbackURI}`);
      const conn = await mongoose.connect(fallbackURI, {
        maxPoolSize: 20,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000
      } as any);
      console.log(`[db]: ✅ Connected to Fallback local MongoDB → Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
    } catch (fallbackError: any) {
      console.error('[db]: ❌ MongoDB connection failed:', error.message);
      console.error('[db]: Please check your Internet connection / Wi-Fi, or ensure local MongoDB service is running.');
      process.exit(1);
    }
  }
};
