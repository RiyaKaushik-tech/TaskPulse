import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import path from "path";

import authRouter from "./routes/auth.router.js";
import taskRouter from "./routes/task.router.js";
import userRouter from "./routes/user.Router.js";
import reportRouter  from "./routes/reportRouter.js"

import { fileURLToPath } from 'url';

const __filename__= fileURLToPath(import.meta.url);
const __dirname__ = path.dirname(__filename__)

const rawPort = process.env.PORT;
const parsedPort = Number(rawPort);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const app = express();
try {
  const corsOptions = {
    origin: FRONTEND_URL,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };


  // IMPORTANT: body parsers BEFORE routes
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));

  app.use(cors(corsOptions));
  // app.options('*', cors(corsOptions)); // handle preflight

  mongoose.connect(process.env.MONGO_URI).then(()=> {
    console.log('Connected to MongoDB');
  }).catch(error => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

  app.get('/', (req, res) => {
    res.send('Welcome to taskPulse');
  });

  // mount auth routes
  app.use("/api/auth", authRouter);
  app.use("/api/users",userRouter);
  app.use("/api/tasks",taskRouter);
  app.use("/api/report",reportRouter);
  app.use("/uploads",express.static(path.join(__dirname__, "uploads")))

  // optional legacy compatibility if you previously used /sign-Up
  app.post('/sign-Up', (req, res) => res.redirect(307, '/api/auth/signUp'));

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`CORS is configured for origin: ${FRONTEND_URL}`);
  });
} catch (error) {
  console.error('Server failed to start:', error);
  process.exit(1);
}

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.statusCode = statusCode;
  res.json({
    success: false,
    statusCode,
    message
  });
})

// simple logger (helps debug incoming requests)
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

// serve uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// make sure CORS allows credentials if you use cookies
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// global error handler (avoid double send)
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error("Global error:", err && err.stack ? err.stack : err);
  const status = err?.statusCode || 500;
  const message = err?.message || "Internal server error";
  res.status(status).json({ success: false, statusCode: status, message });
});