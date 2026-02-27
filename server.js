import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

// ES Module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Import Prisma client
import prisma from './src/config/prisma.js';

// Import routes
import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/user.routes.js';
import productRoutes from './src/routes/product.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import categoryRoutes from './src/routes/category.routes.js';
import reviewRoutes from './src/routes/review.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import favoriteRoutes from './src/routes/favorite.routes.js';
import newsletterRoutes from './src/routes/newsletter.routes.js';
import teamRoutes from './src/routes/team.routes.js';
import statsRoutes from './src/routes/stats.routes.js';
import contactRoutes from './src/routes/contact.routes.js';
import couponRoutes from './src/routes/coupon.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';
import verificationRoutes from './src/routes/verification.routes.js';
import searchRoutes from './src/routes/search.routes.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import chatRoutes from './src/routes/chat.routes.js';

// Import error handler
import errorHandler from './src/middleware/errorHandler.js';

const app = express();
const httpServer = createServer(app);

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Store connected users
const connectedUsers = new Map();

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.userId}`);
  
  // Store user socket
  connectedUsers.set(socket.userId, socket.id);

  // Join user's personal room
  socket.join(`user:${socket.userId}`);

  // Handle joining conversation rooms
  socket.on('join:conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`👤 User ${socket.userId} joined conversation ${conversationId}`);
  });

  // Handle leaving conversation rooms
  socket.on('leave:conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`👋 User ${socket.userId} left conversation ${conversationId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.userId}`);
    connectedUsers.delete(socket.userId);
  });
});

// Make io accessible to routes
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TechStore API is Online',
    websocket: 'Socket.IO enabled'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection established successfully');

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 Socket.IO enabled for real-time chat`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📊 Prisma Studio: npx prisma studio`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;
