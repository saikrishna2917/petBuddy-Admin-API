const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Global cache for serverless environments (like Vercel) to prevent connection exhaustion
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // If connection is already established and active, reuse it
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    logger.info("Initializing new MongoDB connection...");
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000, 
      family: 4 // Force IPv4. This specifically fixes the "Client network socket disconnected before secure TLS connection was established" error on Vercel Node 18+
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongooseInstance) => {
      logger.info(`MongoDB Connected: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    }).catch(error => {
      cached.promise = null;
      logger.error(`Error connecting to MongoDB: ${error.message}`);
      throw error;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;
