// backend/src/config/db.ts — REPLACE ENTIRE FILE
import mongoose from 'mongoose';
import { env }  from './env';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log('[DB] Already connected to MongoDB');
    return;
  }

  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(env.MONGO_URI, {  // ← was env.MONGODB_URI
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS:          45000,
    });

    isConnected = true;
    console.log(`✅ [DB] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ [DB] MongoDB connection failed:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️ [DB] MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('✅ [DB] MongoDB reconnected');
});

mongoose.connection.on('error', (err: Error) => {
  console.error('❌ [DB] MongoDB error:', err.message);
});
