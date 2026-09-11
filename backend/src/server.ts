import express, { Request, Response } from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import { connectDB } from './config/db';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = ENV.PORT;
const FRONTEND_URL = ENV.FRONTEND_URL;

// CORS configuration
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware in development
if (ENV.NODE_ENV !== 'test') {
  app.use((req: Request, _res: Response, next) => {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// API Routes
app.use('/api', apiRoutes);

// Root greeting & status
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Coastal Surveillance Console - REST API Backend',
    version: '1.0.0',
    documentation: '/api/health',
    status: 'ACTIVE',
  });
});

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start server function
export const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log('\n========================================================================');
    console.log(`🚀 Coastal Surveillance Backend listening on port ${PORT}`);
    console.log(`📡 API Base URL:      http://localhost:${PORT}/api`);
    console.log(`🌐 Health Check:      http://localhost:${PORT}/api/health`);
    console.log(`💻 Frontend Allowed:  ${FRONTEND_URL}`);
    console.log('========================================================================\n');
  });

  return server;
};

// Start if executed directly
if (ENV.NODE_ENV !== 'test') {
  startServer();
}

export default app;
