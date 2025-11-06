require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

// Import routes
const authRoutes = require('./src/routes/auth');
const itemRoutes = require('./src/routes/items');
const chatRoutes = require('./src/routes/chat');
// Note: route file is named `notification.js` (singular).
const notificationRoutes = require('./src/routes/notification');
const userRoutes = require('./src/routes/users');
const adminRoutes = require('./src/routes/admin');

const app = express();

// Sentry (optional) - initialize if @sentry/node is installed and SENTRY_DSN is set
let SENTRY = null;
try {
  // require here so package is optional during development
  // eslint-disable-next-line global-require
  const SentryLib = require('@sentry/node');
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    SentryLib.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
    });
    SENTRY = SentryLib;
    console.log('Sentry initialized');
  } else {
    console.log('Sentry DSN not provided - skipping Sentry initialization');
  }
} catch (err) {
  console.log('Optional dependency @sentry/node not installed. To enable Sentry run: npm install @sentry/node');
}
const server = http.createServer(app);

const path = require('path');

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: [process.env.CLIENT_URL_WEB, process.env.CLIENT_URL_MOBILE],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [process.env.CLIENT_URL_WEB, process.env.CLIENT_URL_MOBILE],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Make io accessible in routes
app.set('io', io);

// Attach Sentry request handler early if we have it
if (SENTRY) {
  app.use(SENTRY.Handlers.requestHandler());
}

// Serve uploaded files (local development uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.userId}`);
  
  // Join user's personal room for notifications
  socket.join(`user_${socket.userId}`);

  // Handle chat events
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`User ${socket.userId} joined chat ${chatId}`);
  });

  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`User ${socket.userId} left chat ${chatId}`);
  });

  socket.on('typing', ({ chatId, isTyping }) => {
    socket.to(`chat_${chatId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.userId}`);
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Lost & Found API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (SENTRY) {
    try { SENTRY.captureException(err); } catch (e) { console.warn('Sentry capture failed', e); }
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Attach Sentry error handler middleware (after our handlers) so Sentry can process errors
if (SENTRY) {
  app.use(SENTRY.Handlers.errorHandler());
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
    ╔═══════════════════════════════════════╗
    ║  🚀 Server is running on port ${PORT}   ║
    ║  📍 http://localhost:${PORT}            ║
    ║  🔌 Socket.IO is ready                ║
    ╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Capture uncaught errors and rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  if (SENTRY) {
    try { SENTRY.captureException(reason); } catch (e) { console.warn('Sentry capture failed', e); }
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (SENTRY) {
    try { SENTRY.captureException(err); } catch (e) { console.warn('Sentry capture failed', e); }
  }
  // It's recommended to exit after uncaughtException in Node apps
  process.exit(1);
});