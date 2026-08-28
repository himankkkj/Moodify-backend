import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.route.js';

const app = express();

// 1. Trust proxy for secure cookies / IP detection behind Render reverse proxy
app.set('trust proxy', 1);

// 2. Allowed origins supporting Cloudflare Pages (.pages.dev), env variables, and Localhost
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.pages.dev') || origin.endsWith('.onrender.com'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 3. Health check endpoint (used to keep Render awake with UptimeRobot)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

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