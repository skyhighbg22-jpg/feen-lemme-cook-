/**
 * Standardized Error Handling
 * Consistent error responses across the API
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "./db";

// Error codes
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  TWO_FACTOR_REQUIRED = "TWO_FACTOR_REQUIRED",
  TWO_FACTOR_INVALID = "TWO_FACTOR_INVALID",

  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // Resource errors
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  CONFLICT = "CONFLICT",

  // Rate limiting
  RATE_LIMITED = "RATE_LIMITED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",

  // Scope errors
  INSUFFICIENT_SCOPE = "INSUFFICIENT_SCOPE",
  SCOPE_DENIED = "SCOPE_DENIED",

  // Server errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",

  // Business logic errors
  OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED",
  LIMIT_EXCEEDED = "LIMIT_EXCEEDED",
  SUBSCRIPTION_REQUIRED = "SUBSCRIPTION_REQUIRED",
}

// HTTP status codes mapping
const ErrorStatusCodes: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.TWO_FACTOR_REQUIRED]: 403,
  [ErrorCode.TWO_FACTOR_INVALID]: 401,

  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,

  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.CONFLICT]: 409,

  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.QUOTA_EXCEEDED]: 429,

  [ErrorCode.INSUFFICIENT_SCOPE]: 403,
  [ErrorCode.SCOPE_DENIED]: 403,

  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,

  [ErrorCode.OPERATION_NOT_ALLOWED]: 403,
  [ErrorCode.LIMIT_EXCEEDED]: 400,
  [ErrorCode.SUBSCRIPTION_REQUIRED]: 402,
};

// Error response interface
export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
    timestamp: string;
  };
}

// Custom error class
export class FeenError extends Error {
  code: ErrorCode;
  details?: Record<string, unknown>;
  statusCode: number;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "FeenError";
    this.code = code;
    this.details = details;
    this.statusCode = ErrorStatusCodes[code] || 500;
  }
}

// Create error response
export function createErrorResponse(
  error: FeenError | Error | ZodError,
  requestId?: string
): NextResponse<ApiError> {
  const timestamp = new Date().toISOString();

  // Handle FeenError
  if (error instanceof FeenError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId,
          timestamp,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle ZodError
  if (error instanceof ZodError) {
    const details = error.errors.reduce(
      (acc, err) => {
        const path = err.path.join(".");
        acc[path] = err.message;
        return acc;
      },
      {} as Record<string, string>
    );

    return NextResponse.json(
      {
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: "Validation failed",
          details,
          requestId,
          timestamp,
        },
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  console.error("Unhandled error:", error);

  return NextResponse.json(
    {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "An unexpected error occurred",
        requestId,
        timestamp,
      },
    },
    { status: 500 }
  );
}

// Error handler wrapper for API routes
export function withErrorHandler<T>(
  handler: (request: Request, context: T) => Promise<NextResponse>
) {
  return async (request: Request, context: T): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();

    try {
      // Add request ID header
      const response = await handler(request, context);
      response.headers.set("X-Request-ID", requestId);
      return response;
    } catch (error) {
      // Log error
      logError(error, requestId, request);

      if (error instanceof FeenError || error instanceof ZodError) {
        return createErrorResponse(error, requestId);
      }

      return createErrorResponse(error as Error, requestId);
    }
  };
}

// Log error to database
async function logError(
  error: unknown,
  requestId: string,
  request: Request
): Promise<void> {
  try {
    const errorDetails = {
      requestId,
      url: request.url,
      method: request.method,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : String(error),
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", errorDetails);
    }

    // Log to database
    await db.auditLog.create({
      data: {
        action: "API_ERROR",
        resource: "api",
        resourceId: requestId,
        details: errorDetails,
      },
    });
  } catch {
    // Don't throw from error logging
    console.error("Failed to log error:", error);
  }
}

// Convenience error creators
export const Errors = {
  unauthorized: (message = "Unauthorized") =>
    new FeenError(ErrorCode.UNAUTHORIZED, message),

  forbidden: (message = "Access denied") =>
    new FeenError(ErrorCode.FORBIDDEN, message),

  notFound: (resource = "Resource") =>
    new FeenError(ErrorCode.NOT_FOUND, `${resource} not found`),

  alreadyExists: (resource = "Resource") =>
    new FeenError(ErrorCode.ALREADY_EXISTS, `${resource} already exists`),

  validation: (message: string, details?: Record<string, unknown>) =>
    new FeenError(ErrorCode.VALIDATION_ERROR, message, details),

  rateLimited: (retryAfter?: number) =>
    new FeenError(ErrorCode.RATE_LIMITED, "Rate limit exceeded", {
      retryAfter,
    }),

  insufficientScope: (required: string[], provided: string[]) =>
    new FeenError(ErrorCode.INSUFFICIENT_SCOPE, "Insufficient scope", {
      required,
      provided,
    }),

  twoFactorRequired: () =>
    new FeenError(ErrorCode.TWO_FACTOR_REQUIRED, "Two-factor authentication required"),

  internal: (message = "Internal server error") =>
    new FeenError(ErrorCode.INTERNAL_ERROR, message),
};
