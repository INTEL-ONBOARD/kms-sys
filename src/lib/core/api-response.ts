import { NextResponse } from "next/server";
export { handleApiError, withErrorHandler } from "@/errors";
export type { ApiErrorPayload, RouteHandler } from "@/errors";

/**
 * Standard API Response envelope and helpers.
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
