import { AppError } from "./AppError";
import { ErrorCode, ErrorCodeType } from "./errorCodes";

/**
 * 400 Bad Request Exception
 */
export class BadRequestException extends AppError {
  constructor(message = "Bad Request", details?: unknown, code: ErrorCodeType = ErrorCode.BAD_REQUEST) {
    super(message, 400, code, details);
  }
}
export const BadRequestError = BadRequestException;

/**
 * 401 Unauthorized Exception
 */
export class UnauthorizedException extends AppError {
  constructor(message = "Authentication required or invalid session", code: ErrorCodeType = ErrorCode.UNAUTHORIZED) {
    super(message, 401, code);
  }
}
export const UnauthorizedError = UnauthorizedException;

/**
 * 403 Forbidden Exception
 */
export class ForbiddenException extends AppError {
  constructor(message = "You do not have permission to access this resource", code: ErrorCodeType = ErrorCode.FORBIDDEN) {
    super(message, 403, code);
  }
}
export const ForbiddenError = ForbiddenException;

/**
 * 404 Not Found Exception
 */
export class NotFoundException extends AppError {
  constructor(message = "Resource not found", code: ErrorCodeType = ErrorCode.NOT_FOUND) {
    super(message, 404, code);
  }
}
export const NotFoundError = NotFoundException;

/**
 * 409 Conflict Exception
 */
export class ConflictException extends AppError {
  constructor(message = "Resource conflict detected", details?: unknown, code: ErrorCodeType = ErrorCode.CONFLICT) {
    super(message, 409, code, details);
  }
}
export const ConflictError = ConflictException;

/**
 * 422 Validation / Unprocessable Entity Exception
 */
export class ValidationException extends AppError {
  constructor(message = "Validation failed for provided input", details?: unknown, code: ErrorCodeType = ErrorCode.UNPROCESSABLE_ENTITY) {
    super(message, 422, code, details);
  }
}
export const ValidationError = ValidationException;
export const UnprocessableEntityException = ValidationException;

/**
 * 429 Rate Limit Exception
 */
export class RateLimitException extends AppError {
  constructor(message = "Too many requests. Please try again later.", details?: unknown) {
    super(message, 429, ErrorCode.RATE_LIMIT_EXCEEDED, details);
  }
}

/**
 * 500 Internal Server Exception
 */
export class InternalServerException extends AppError {
  constructor(message = "An unexpected server error occurred", details?: unknown, code: ErrorCodeType = ErrorCode.INTERNAL_SERVER_ERROR) {
    super(message, 500, code, details);
  }
}
export const InternalServerError = InternalServerException;
