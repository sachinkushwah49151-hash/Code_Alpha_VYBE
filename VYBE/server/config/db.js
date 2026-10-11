/**
 * VYBE Database Configuration
 * Phase 2/3: MongoDB Connection via Mongoose
 */

const dns = require('dns');
const mongoose = require('mongoose');

/**
 * Safely extracts host/cluster name from connection URI for logging without exposing credentials
 * @param {string} uri
 * @returns {string} Safe host or cluster name
 */
const getSafeHost = (uri) => {
  if (!uri) return 'undefined';
  try {
    const atSplit = uri.split('@');
    if (atSplit.length > 1) {
      return atSplit[atSplit.length - 1].split('/')[0].split('?')[0];
    }
    const protoSplit = uri.split('://');
    if (protoSplit.length > 1) {
      return protoSplit[1].split('/')[0].split('?')[0];
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

/**
 * Connect to MongoDB instance
 * Prevents multiple concurrent connections and handles connection errors.
 * @returns {Promise<mongoose.Connection>}
 */
const connectDB = async () => {
  // If already connected or connecting, return the existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not defined in environment variables. ' +
      'Please configure MONGODB_URI in your .env file ' +
      '(e.g., mongodb://localhost:27017/vybe_social or a MongoDB Atlas URI).'
    );
  }

  const safeHost = getSafeHost(uri);
  console.log(`[VYBE] Connecting to MongoDB host: ${safeHost}`);

  // When connecting via SRV protocol (mongodb+srv://), configure public DNS resolvers
  // to avoid Windows local DNS / ISP querySrv ECONNREFUSED issues with SRV records.
  if (uri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    } catch (dnsErr) {
      // Continue with system defaults if setServers fails
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(
      `[VYBE] MongoDB Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`
    );

    return conn.connection;
  } catch (error) {
    console.error(`[VYBE Error] MongoDB connection to [${safeHost}] failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
