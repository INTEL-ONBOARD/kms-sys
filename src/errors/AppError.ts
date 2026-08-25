import { ErrorCode, ErrorCodeType } from "./errorCodes";

export interface ErrorResponseJSON {
  success: false;
  message: string;
  code: string;
  error: string;
  statusCode: number;
  details?: unknown;
  timestamp: string;
}

/**
 * Base Application Error class.
 * All domain and HTTP exceptions extend this class.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCodeType | string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode = 500,
    code: ErrorCodeType | string = ErrorCode.INTERNAL_SERVER_ERROR,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintain proper stack trace in V8 engines
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serializes the error into a standard API response JSON payload.
   */
  public toJSON(): ErrorResponseJSON {
    return {
      success: false,
      message: this.message,
      code: this.code,
      error: this.message,
      statusCode: this.statusCode,
      ...(this.details !== undefined ? { details: this.details } : {}),
      timestamp: this.timestamp,
    };
  }
}
