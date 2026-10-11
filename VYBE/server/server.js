/**
 * VYBE - Social Media Platform Backend Server
 * Phase 2: MongoDB + Mongoose Integration
 */

const path = require('path');
const dotenv = require('dotenv');

// 1. Ensure dotenv loads the correct VYBE/server/.env file before any database connection is initialized
const serverEnvPath = path.resolve(__dirname, '.env');
dotenv.config({ path: serverEnvPath });

// Fallback to parent directory .env if MONGODB_URI is not loaded
if (!process.env.MONGODB_URI) {
  const parentEnvPath = path.resolve(__dirname, '..', '.env');
  dotenv.config({ path: parentEnvPath });
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { SERVER_BOOT_ID, IS_DEV_MODE } = require('./config/bootSession');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    exposedHeaders: ['X-VYBE-Boot-Id', 'X-VYBE-Env'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach Server Boot ID header & cookie so frontend detects server restarts immediately
app.use((req, res, next) => {
  res.set('X-VYBE-Boot-Id', SERVER_BOOT_ID);
  res.set('X-VYBE-Env', IS_DEV_MODE ? 'development' : 'production');
  res.append(
    'Set-Cookie',
    `vybe_server_boot=${SERVER_BOOT_ID}; Path=/; SameSite=Lax`
  );
  next();
});

// API Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const isConnected = dbState === 1;

  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'healthy' : 'degraded',
    project: 'VYBE Social Media Platform',
    phase: 'Phase 2 - MongoDB & Mongoose Integration',
    bootId: SERVER_BOOT_ID,
    env: IS_DEV_MODE ? 'development' : 'production',
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      connected: isConnected,
      name: mongoose.connection.name || null,
    },
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
const { deleteComment } = require('./controllers/postController');
const { protect } = require('./middleware/authMiddleware');
app.delete('/api/comments/:id', protect, deleteComment);

// 404 Handler for Unmatched API Routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found.',
  });
});

// Static Frontend & Explicit Root Entry Routing
const clientDir = path.resolve(__dirname, '..', 'client');

app.get(['/', '/index.html', '/login.html'], (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(clientDir, 'index.html'));
});

app.use(
  express.static(clientDir, {
    etag: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      }
    },
  })
);

/**
 * Start Express Server with resilient MongoDB connection
 */
const startServer = async (port = PORT) => {
  let dbConnected = false;
  try {
    await connectDB();
    dbConnected = true;
    const { seedMongoDBIfEmpty } = require('./data/seedData');
    await seedMongoDBIfEmpty();
  } catch (error) {
    console.warn(`[VYBE Warning] MongoDB initial connection pending: ${error.message}`);
    console.warn(`[VYBE Server] Running in resilient mode with community seed data.`);

    // Attempt background reconnection
    const retryInterval = setInterval(async () => {
      try {
        if (mongoose.connection.readyState !== 1) {
          await connectDB();
          console.log('[VYBE Reconnect] Connected to MongoDB in background!');
          const { seedMongoDBIfEmpty } = require('./data/seedData');
          await seedMongoDBIfEmpty();
          clearInterval(retryInterval);
        }
      } catch (retryErr) {
        // Keep retrying in background
      }
    }, 15000);
  }

  const server = app.listen(port, () => {
    console.log(`========================================`);
    console.log(`⚡ VYBE API Server Running on Port ${port}`);
    console.log(`🌐 Health check: http://localhost:${port}/api/health`);
    console.log(`📌 Database: ${dbConnected ? 'MongoDB Connected' : 'Community Seed Fallback (Auto-reconnecting)'}`);
    console.log(`========================================`);
  });

  // Also serve frontend on port 3000 when running main server on 5000
  const frontendPort = Number(process.env.FRONTEND_PORT || 3000);
  if (Number(port) !== frontendPort) {
    const feServer = app.listen(frontendPort, () => {
      console.log(`🎨 VYBE Frontend Server Running at http://localhost:${frontendPort}/`);
    });
    feServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`ℹ️ Port ${frontendPort} already in use by external static server.`);
      }
    });
  }

  return server;
};

// Execute startup when invoked directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
