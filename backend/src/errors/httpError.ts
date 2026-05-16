export type ApiErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR';

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details: ApiErrorDetail[];

  constructor(
    statusCode: number,
    code: ApiErrorCode,
    message: string,
    details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
