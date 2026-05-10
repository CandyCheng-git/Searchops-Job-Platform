import express, { Express, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import healthRouter from './routes/health.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());

  // Request ID middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    (req as any).requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });

  // Routes
  app.use('/health', healthRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
      },
    });
  });

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (_req as any).requestId,
      },
    });
  });

  return app;
}
