import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/testnova', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`📦 MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('⚠️ MongoDB connection failed:', error.message);
    console.warn('⚠️ Server will continue — DB-dependent routes will fail');
  }
};
