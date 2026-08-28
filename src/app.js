import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.route.js';

const app = express();

// Trust proxy for secure cookies / IP detection behind proxies
app.set('trust proxy', 1);

// CORS middleware supporting credentials
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Auth routes
app.use('/api/auth', authRouter);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

export default app;