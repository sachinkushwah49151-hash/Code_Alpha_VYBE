/**
 * VYBE Development Boot Session Tracker
 * Generates a unique ephemeral boot ID each time the server starts.
 * In development mode, tokens and browser sessions from previous server
 * runs are invalidated on server restart so the app always starts fresh at login.
 */

const crypto = require('crypto');

const SERVER_BOOT_ID = crypto.randomBytes(12).toString('hex');
const IS_DEV_MODE = (process.env.NODE_ENV || 'development') !== 'production';

module.exports = {
  SERVER_BOOT_ID,
  IS_DEV_MODE,
};
