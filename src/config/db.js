const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async (retries = 5, delay = 5000) => {
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      return; // Exit loop on successful connection
    } catch (error) {
      logger.error(`Error connecting to MongoDB: ${error.message}`);
      retries -= 1;
      logger.info(`Retries left: ${retries}`);
      if (retries === 0) {
        logger.error('Failed to connect to MongoDB after multiple attempts. Exiting...');
        process.exit(1);
      }
      logger.info(`Waiting ${delay / 1000} seconds before retrying...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
