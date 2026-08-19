import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

/**
 * Standard API Response envelope and error handler.
 */

export interface ApiResponseOptions<T> {
  data?: T;
  message?: string;
  statusCode?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    hasMore?: boolean;
  };
  extra?: Record<string, unknown>;
}

/**
 * Creates a standard JSON success response.
 * Merges data and extra fields cleanly to maintain 100% backward compatibility with existing frontend expectations.
 */
export function successResponse<T>(
  data?: T,
  message?: string,
  statusCode = 200,
  extra?: Record<string, unknown>
): NextResponse {
  // If data is an object (and not an array or null), spread its properties so legacy frontend callers
  // that expect { users: [...] }, { courses: [...] }, or { submission: {...} } receive them directly.
  let responseBody: Record<string, unknown> = {};

  if (data !== undefined && data !== null) {
    if (typeof data === "object" && !Array.isArray(data)) {
      responseBody = { ...(data as Record<string, unknown>) };
    } else {
      responseBody = { data };
    }
  }

  if (message) {
    responseBody.message = message;
  }

  if (extra) {
    responseBody = { ...responseBody, ...extra };
  }

  return NextResponse.json(responseBody, { status: statusCode });
}

/**
 * Creates a paginated response.
 */
export function paginatedResponse<T>(
  items: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
    hasMore?: boolean;
  },
  message?: string,
  extra?: Record<string, unknown>
): NextResponse {
  const totalPages = pagination.totalPages ?? Math.ceil(pagination.total / (pagination.limit || 1));
  const hasMore = pagination.hasMore ?? (pagination.page * pagination.limit < pagination.total);

  return NextResponse.json(
    {
      data: items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages,
        hasMore,
      },
      ...(message ? { message } : {}),
      ...(extra ? extra : {}),
    },
    { status: 200 }
  );
}

/**
 * Centralized API Error handler.
 * Maps application errors, Zod errors, and Mongoose errors to structured HTTP responses and logs context.
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  const timestamp = new Date().toISOString();
  const contextPrefix = context ? `[${context}] ` : "";

  // 1. Known AppError instances
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      console.error(`${contextPrefix}AppError (${error.code}):`, error);
    } else {
      console.warn(`${contextPrefix}AppError (${error.code}) [${error.statusCode}]: ${error.message}`);
    }

    return NextResponse.json(
      {
        message: error.message,
        code: error.code,
        error: error.message,
        ...(error.details ? { details: error.details } : {}),
        timestamp,
      },
      { status: error.statusCode }
    );
  }

  // 2. Zod Validation Errors
  if (error instanceof ZodError) {
    const formattedIssues = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    const message = formattedIssues.map((i) => (i.field ? `${i.field}: ${i.message}` : i.message)).join(", ");

    console.warn(`${contextPrefix}Validation Error:`, formattedIssues);

    return NextResponse.json(
      {
        message: `Validation failed: ${message}`,
        code: "VALIDATION_ERROR",
        error: message,
        details: formattedIssues,
        timestamp,
      },
      { status: 400 }
    );
  }

  // 3. Mongoose CastError / ValidationError / Duplicate Key
  if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, any>;

    // Duplicate key (MongoDB E11000)
    if (errObj.code === 11000) {
      const keys = Object.keys(errObj.keyPattern || errObj.keyValue || {});
      const duplicateField = keys.length > 0 ? keys[0] : "record";
      const message = `A record with this ${duplicateField} already exists.`;
      console.warn(`${contextPrefix}Duplicate Key Error:`, message);

      return NextResponse.json(
        {
          message,
          code: "DUPLICATE_KEY_ERROR",
          error: message,
          timestamp,
        },
        { status: 409 }
      );
    }

    // Mongoose ValidationError
    if (errObj.name === "ValidationError" && errObj.errors) {
      const errors = Object.values(errObj.errors).map((e: any) => e.message);
      const message = errors.join(", ");
      console.warn(`${contextPrefix}Mongoose Validation Error:`, message);

      return NextResponse.json(
        {
          message: `Validation failed: ${message}`,
          code: "MONGOOSE_VALIDATION_ERROR",
          error: message,
          timestamp,
        },
        { status: 400 }
      );
    }

    // Mongoose CastError (invalid ObjectId)
    if (errObj.name === "CastError") {
      const message = `Invalid identifier format for field '${errObj.path}'`;
      console.warn(`${contextPrefix}Cast Error:`, message);

      return NextResponse.json(
        {
          message,
          code: "INVALID_ID_FORMAT",
          error: message,
          timestamp,
        },
        { status: 400 }
      );
    }
  }

  // 4. Fallback / Unhandled generic errors
  const fallbackMessage = error instanceof Error ? error.message : "Internal Server Error";
  console.error(`${contextPrefix}Unhandled Exception:`, error);

  return NextResponse.json(
    {
      message: "Internal Server Error",
      code: "INTERNAL_SERVER_ERROR",
      error: fallbackMessage,
      timestamp,
    },
    { status: 500 }
  );
}
