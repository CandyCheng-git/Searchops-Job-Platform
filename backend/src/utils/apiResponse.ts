import { Request, Response } from 'express';
import type { ApiErrorCode, ApiErrorDetail } from '../errors/httpError.js';

function getRequestId(req: Request): string {
  const requestId = (req as any).requestId;

  if (Array.isArray(requestId)) {
    return requestId[0] ?? '';
  }

  return requestId ?? '';
}

export function sendSuccess<T>(
  req: Request,
  res: Response,
  data: T,
  statusCode = 200,
): Response {
  return res.status(statusCode).json({
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: getRequestId(req),
    },
  });
}

export function sendError(
  req: Request,
  res: Response,
  statusCode: number,
  code: ApiErrorCode,
  message: string,
  details: ApiErrorDetail[] = [],
): Response {
  return res.status(statusCode).json({
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: getRequestId(req),
    },
  });
}
