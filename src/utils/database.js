import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Railway service connection with fallbacks
const buildMongoURI = () => {
  // Try direct MONGO_URL first (external connection)
  if (process.env.MONGO_URL) {
    return process.env.MONGO_URL;
  }
  
  // Try Railway service reference (automatic service linking)
  if (process.env.MONGO_PRIVATE_URL) {
    return process.env.MONGO_PRIVATE_URL;
  }
  
  // Try manual Railway service reference (internal connection)
  if (process.env.MONGOHOST && process.env.MONGOUSER && process.env.MONGOPASSWORD) {
    return `mongodb://${process.env.MONGOUSER}:${process.env.MONGOPASSWORD}@${process.env.MONGOHOST}:${process.env.MONGOPORT || 27017}/fuxi_reactive`;
  }
  
  // Fallback to MONGODB_URI
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  
  // Local development fallback
  return 'mongodb://localhost:27017/fuxi_reactive';
};

const MONGODB_URI = buildMongoURI();

export async function connectDatabase() {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('📍 Connection URI:', MONGODB_URI.replace(/:[^:@]*@/, ':****@')); // Hide password in logs
    
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Set up connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
}

