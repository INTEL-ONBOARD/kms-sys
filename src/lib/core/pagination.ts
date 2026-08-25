import { NextRequest } from "next/server";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  sortBy: string;
  sortOrder: "asc" | "desc" | 1 | -1;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Parses and validates pagination and search query parameters from a NextRequest.
 */
export function parsePaginationParams(
  req: NextRequest | Request,
  defaultLimit = 10,
  maxLimit = 100
): PaginationParams {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const rawLimit = parseInt(searchParams.get("limit") || String(defaultLimit), 10);
  let limit = isNaN(rawLimit) || rawLimit < 1 ? defaultLimit : rawLimit;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;

  const search = searchParams.get("search")?.trim() || searchParams.get("q")?.trim() || undefined;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const rawOrder = searchParams.get("sortOrder") || searchParams.get("order") || "desc";
  const sortOrder = rawOrder.toLowerCase() === "asc" ? 1 : -1;

  return {
    page,
    limit,
    skip,
    search,
    sortBy,
    sortOrder,
  };
}

/**
 * Builds standard pagination metadata object.
 */
export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / (limit || 1)) || 1;
  const hasMore = page < totalPages;

  return {
    page,
    limit,
    total,
    totalPages,
    hasMore,
  };
}

/**
 * Creates safe RegExp for searching text fields.
 */
export function createSafeSearchRegex(searchTerm: string): RegExp {
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped, "i");
}
