import { NextResponse, NextRequest } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./AppError";
import { ErrorCode } from "./errorCodes";

export interface ApiErrorPayload {
  success: false;
  message: string;
  code: string;
  error: string;
  statusCode: number;
  details?: unknown;
  timestamp: string;
}

/**
 * Centralized API & Server Error Handler.
 * Converts domain exceptions, Zod validation errors, and MongoDB errors
 * into structured, safe HTTP responses.
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  const timestamp = new Date().toISOString();
  const contextPrefix = context ? `[${context}] ` : "";

  // 1. Domain AppError / HttpExceptions
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      console.error(`${contextPrefix}AppError (${error.code}) [${error.statusCode}]:`, error);
    } else {
      console.warn(`${contextPrefix}AppError (${error.code}) [${error.statusCode}]: ${error.message}`);
    }

    const payload: ApiErrorPayload = {
      success: false,
      message: error.message,
      code: error.code,
      error: error.message,
      statusCode: error.statusCode,
      ...(error.details !== undefined ? { details: error.details } : {}),
      timestamp,
    };

    return NextResponse.json(payload, { status: error.statusCode });
  }

  // 2. Zod Schema Validation Errors
  if (error instanceof ZodError) {
    const formattedIssues = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
    const message = formattedIssues.map((i) => (i.field ? `${i.field}: ${i.message}` : i.message)).join(", ");

    console.warn(`${contextPrefix}Validation Error:`, formattedIssues);

    const payload: ApiErrorPayload = {
      success: false,
      message: `Validation failed: ${message}`,
      code: ErrorCode.VALIDATION_ERROR,
      error: message,
      statusCode: 400,
      details: formattedIssues,
      timestamp,
    };

    return NextResponse.json(payload, { status: 400 });
  }

  // 3. Mongoose / MongoDB Database Errors
  if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, any>;

    // Duplicate key constraint (E11000)
    if (errObj.code === 11000) {
      const keys = Object.keys(errObj.keyPattern || errObj.keyValue || {});
      const duplicateField = keys.length > 0 ? keys[0] : "record";
      const message = `A record with this ${duplicateField} already exists.`;
      console.warn(`${contextPrefix}Duplicate Key Error:`, message);

      const payload: ApiErrorPayload = {
        success: false,
        message,
        code: ErrorCode.DUPLICATE_KEY_ERROR,
        error: message,
        statusCode: 409,
        timestamp,
      };

      return NextResponse.json(payload, { status: 409 });
    }

    // Invalid ObjectId format (CastError)
    if (errObj.name === "CastError" && errObj.kind === "ObjectId") {
      const message = `Invalid resource identifier format: '${errObj.value}'.`;
      console.warn(`${contextPrefix}Mongoose CastError:`, message);

      const payload: ApiErrorPayload = {
        success: false,
        message,
        code: ErrorCode.INVALID_ID_FORMAT,
        error: message,
        statusCode: 400,
        timestamp,
      };

      return NextResponse.json(payload, { status: 400 });
    }

    // Mongoose Model Validation Error
    if (errObj.name === "ValidationError" && errObj.errors) {
      const messages = Object.values(errObj.errors).map((e: any) => e.message || "Invalid field value");
      const message = messages.join(", ");
      console.warn(`${contextPrefix}Mongoose ValidationError:`, message);

      const payload: ApiErrorPayload = {
        success: false,
        message,
        code: ErrorCode.VALIDATION_ERROR,
        error: message,
        statusCode: 400,
        details: errObj.errors,
        timestamp,
      };

      return NextResponse.json(payload, { status: 400 });
    }
  }

  // 4. Standard native Error or Unhandled Exception
  const unhandled = error instanceof Error ? error : new Error(String(error));
  console.error(`${contextPrefix}Unhandled Exception:`, unhandled);

  const payload: ApiErrorPayload = {
    success: false,
    message: process.env.NODE_ENV === "production" ? "An unexpected server error occurred." : unhandled.message,
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    error: unhandled.message,
    statusCode: 500,
    ...(process.env.NODE_ENV !== "production" && unhandled.stack ? { details: unhandled.stack } : {}),
    timestamp,
  };

  return NextResponse.json(payload, { status: 500 });
}

/**
 * Route Handler Wrapper (Higher-Order Function)
 * Wraps any Next.js route handler function with automatic error catching.
 *
 * Example:
 * ```ts
 * export const GET = withErrorHandler(async (req, { params }) => {
 *   const data = await getCourse(params.id);
 *   return successResponse(data);
 * }, "GET_COURSE");
 * ```
 */
export type RouteHandler<TContext = any> = (
  req: NextRequest,
  context: TContext
) => Promise<NextResponse | Response> | NextResponse | Response;

export function withErrorHandler<TContext = any>(
  handler: RouteHandler<TContext>,
  contextName?: string
): RouteHandler<TContext> {
  return async (req: NextRequest, context: TContext) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error, contextName || req.nextUrl?.pathname);
    }
  };
}
