import express from 'express';
import authRouter from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
const app = express();

/**middleware */
app.use(express.json());
app.use(cookieParser());

/**use auth routes */
app.use('/api/auth', authRouter);




export default app;