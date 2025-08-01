/**
 * API Error Handling System
 * REFACTOR: Comprehensive error types and handling for better debugging and UX
 */

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, status: number, code: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details
    };
  }
}

export class NetworkError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 0, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', { resource, identifier });
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, validationDetails?: any) {
    super(message, 400, 'VALIDATION_ERROR', validationDetails);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class CacheError extends Error {
  constructor(message: string, public readonly cacheKey: string) {
    super(message);
    this.name = 'CacheError';
  }
}

/**
 * Error handler utility for API responses
 */
export class ApiErrorHandler {
  static async handleResponse(response: Response): Promise<any> {
    if (response.ok) {
      return response.json();
    }

    const contentType = response.headers.get('content-type');
    let errorBody: any = {};
    
    try {
      if (contentType?.includes('application/json')) {
        errorBody = await response.json();
      } else {
        errorBody = { message: await response.text() };
      }
    } catch {
      errorBody = { message: 'Failed to parse error response' };
    }

    // Handle specific HTTP status codes
    switch (response.status) {
      case 400:
        throw new ValidationError(
          errorBody.message || 'Invalid request parameters',
          errorBody.details
        );
      
      case 404:
        throw new NotFoundError(
          errorBody.resource || 'Resource',
          errorBody.identifier
        );
      
      case 429:
        throw new RateLimitError(errorBody.retryAfter);
      
      case 500:
      case 502:
      case 503:
      case 504:
        throw new ApiError(
          errorBody.message || 'Server error occurred',
          response.status,
          'SERVER_ERROR',
          errorBody
        );
      
      default:
        throw new ApiError(
          errorBody.message || `HTTP ${response.status} error`,
          response.status,
          'UNKNOWN_ERROR',
          errorBody
        );
    }
  }

  static isRetryableError(error: Error): boolean {
    if (error instanceof NetworkError) return true;
    if (error instanceof ApiError) {
      return error.status >= 500 || error.status === 429;
    }
    return false;
  }

  static getRetryDelay(error: Error, attempt: number): number {
    if (error instanceof RateLimitError && error.details?.retryAfter) {
      return error.details.retryAfter * 1000; // Convert to milliseconds
    }
    
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  }
}

/**
 * Retry wrapper for API calls
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  onRetry?: (error: Error, attempt: number) => void
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries || !ApiErrorHandler.isRetryableError(lastError)) {
        throw lastError;
      }

      const delay = ApiErrorHandler.getRetryDelay(lastError, attempt);
      onRetry?.(lastError, attempt);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}