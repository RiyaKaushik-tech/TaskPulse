import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import path from 'path';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import checkOverdueTasks from "./utils/checkOverdueTasks.js";
import checkUserAttendance from "./utils/checkUserAttendance.js";

import authRouter from './routes/auth.router.js';
import taskRouter from './routes/task.router.js';
import userRouter from './routes/user.Router.js';
import reportRouter from './routes/reportRouter.js';
import uploadsRouter from './routes/uploads.route.js';
import logsRouter from "./routes/logs.router.js";
import commentRouter from "./controllers/comment.controller.js";

const __filename__ = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename__);

const rawPort = process.env.PORT;
const parsedPort = Number(rawPort);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const CORS_ORIGIN = process.env.CORS_ORIGIN || FRONTEND_URL;

const app = express();

// --- core middleware (ensure these run before routes) ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// simple request logger (helpful during dev)
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

// CORS - allow credentials if frontend needs cookies/auth
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

// serve uploads directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(UPLOAD_DIR));

// --- create HTTP server + socket.io BEFORE mounting routes ---
const server = http.createServer(app);

const io = new IOServer(server, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
  },
});

// socket handshake auth (attach user id to socket.user)
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization || '').split?.(' ')[1];
    if (!token) return next(new Error('Authentication error'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) return next(new Error('Authentication error'));
    socket.user = { id: String(decoded.id) };
    return next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  try {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user?.id})`);
    if (socket?.user?.id) socket.join(`user:${socket.user.id}`);
    socket.on('disconnect', () => {
      console.log(` Socket disconnected: ${socket.id}`);
    });
  } catch (e) {
    console.warn('socket connection error:', e);
  }
});

// Make io accessible in routes via req.app.get('io')
app.set('io', io);

// Middleware to attach io to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- mount routes AFTER io is set up ---
app.get('/', (req, res) => res.send('Welcome to taskPulse'));

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/report', reportRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/comments',commentRouter)

// --- MongoDB connect with retry ---
const connectWithRetry = (delay = 3000) => {
  mongoose
    .connect(process.env.MONGO_URI, { maxPoolSize: 10 })
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => {
      console.error(' MongoDB connection error:', error?.message || error);
      console.warn(`🔄 Retrying MongoDB connection in ${delay / 1000}s...`);
      setTimeout(() => connectWithRetry(Math.min(delay * 2, 60000)), delay);
    });
};

connectWithRetry();

// --- global error handler (single place) ---
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error(' Global error:', err && err.stack ? err.stack : err);
  const status = err?.statusCode || 500;
  const message = err?.message || 'Internal server error';
  res.status(status).json({ success: false, statusCode: status, message });
});

// --- start server (use server so socket.io works) ---
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 CORS allowed origin: ${CORS_ORIGIN}`);
  console.log(`🔌 Socket.IO ready for connections`);

  // Schedule overdue task check every hour
  setInterval(() => {
    console.log('⏰ Running scheduled overdue task check...');
    checkOverdueTasks(io);
  }, 60 * 60 * 1000); // 1 hour

  // Schedule attendance check every 24 hours (daily at midnight)
  setInterval(() => {
    console.log('📅 Running scheduled user attendance check...');
    checkUserAttendance(io);
  }, 24 * 60 * 60 * 1000); // 24 hours

  // Run once on startup
  console.log(' Running initial overdue task check...');
  checkOverdueTasks(io);
  
  console.log('📊 Running initial attendance check...');
  checkUserAttendance(io);
});

// Export for testing or external use
export { app, server, io };