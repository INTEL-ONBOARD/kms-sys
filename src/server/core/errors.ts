/**
 * Custom Domain & HTTP Application Errors
 * Standardized across the monolith for consistent error handling and tracing.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request", details?: unknown) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required or invalid session") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to access this resource") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists or conflicts with current state") {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input payload", details?: unknown) {
    super(message, 422, "UNPROCESSABLE_ENTITY", details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "An unexpected error occurred", details?: unknown) {
    super(message, 500, "INTERNAL_SERVER_ERROR", details);
  }
}
