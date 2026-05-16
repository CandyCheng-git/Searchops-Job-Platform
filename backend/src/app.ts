import express, { Express, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { HttpError } from './errors/httpError.js';
import healthRouter from './routes/health.js';
import jobsRouter from './routes/jobs.js';
import { sendError } from './utils/apiResponse.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());

  // Request ID middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestIdHeader = req.headers['x-request-id'];
    const requestId = Array.isArray(requestIdHeader)
      ? requestIdHeader[0] ?? uuidv4()
      : requestIdHeader ?? uuidv4();
    (req as any).requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });

  // Routes
  app.use('/health', healthRouter);
  app.use('/api/jobs', jobsRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    sendError(req, res, 404, 'NOT_FOUND', 'Route not found');
  });

  // Error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      sendError(req, res, err.statusCode, err.code, err.message, err.details);
      return;
    }

    console.error('Unhandled error:', err);
    sendError(req, res, 500, 'INTERNAL_ERROR', 'Internal server error');
  });

  return app;
}
