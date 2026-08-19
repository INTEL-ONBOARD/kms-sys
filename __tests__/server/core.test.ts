/**
 * @jest-environment node
 */

import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
} from "@/server/core/errors";
import {
  parsePaginationParams,
  buildPaginationMeta,
  createSafeSearchRegex,
} from "@/server/core/pagination";
import { handleApiError, successResponse, paginatedResponse } from "@/server/core/api-response";

describe("Server Core Infrastructure", () => {
  describe("Custom Error Classes", () => {
    it("should instantiate AppError with correct defaults", () => {
      const err = new AppError("Something went wrong");
      expect(err.message).toBe("Something went wrong");
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe("INTERNAL_SERVER_ERROR");
      expect(err.isOperational).toBe(true);
    });

    it("should instantiate BadRequestError with 400", () => {
      const err = new BadRequestError("Invalid parameter");
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe("BAD_REQUEST");
    });

    it("should instantiate UnauthorizedError with 401", () => {
      const err = new UnauthorizedError();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe("UNAUTHORIZED");
    });

    it("should instantiate ForbiddenError with 403", () => {
      const err = new ForbiddenError();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe("FORBIDDEN");
    });

    it("should instantiate NotFoundError with 404", () => {
      const err = new NotFoundError("Course not found");
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe("NOT_FOUND");
    });

    it("should instantiate ConflictError with 409", () => {
      const err = new ConflictError("Email already in use");
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe("CONFLICT");
    });

    it("should instantiate ValidationError with 422", () => {
      const err = new ValidationError("Schema mismatch");
      expect(err.statusCode).toBe(422);
      expect(err.code).toBe("UNPROCESSABLE_ENTITY");
    });
  });

  describe("Pagination and Search Utilities", () => {
    it("should parse default pagination params", () => {
      const req = new Request("http://localhost:3000/api/courses");
      const params = parsePaginationParams(req, 10, 100);

      expect(params.page).toBe(1);
      expect(params.limit).toBe(10);
      expect(params.skip).toBe(0);
      expect(params.sortOrder).toBe(-1);
    });

    it("should parse custom page, limit, search, and sortOrder", () => {
      const req = new Request("http://localhost:3000/api/courses?page=3&limit=25&search=javascript&order=asc&sortBy=title");
      const params = parsePaginationParams(req, 10, 100);

      expect(params.page).toBe(3);
      expect(params.limit).toBe(25);
      expect(params.skip).toBe(50);
      expect(params.search).toBe("javascript");
      expect(params.sortBy).toBe("title");
      expect(params.sortOrder).toBe(1);
    });

    it("should correctly build pagination metadata", () => {
      const meta = buildPaginationMeta(95, 2, 20);
      expect(meta.page).toBe(2);
      expect(meta.limit).toBe(20);
      expect(meta.total).toBe(95);
      expect(meta.totalPages).toBe(5);
      expect(meta.hasMore).toBe(true);
    });

    it("should escape special characters in safe search regex", () => {
      const regex = createSafeSearchRegex("c++ [intro] (101)");
      expect(regex.test("Learn C++ [Intro] (101)")).toBe(true);
      expect(regex.test("Java 101")).toBe(false);
    });
  });

  describe("API Response and Error Handling", () => {
    it("should build successResponse with backward compatible object shape", async () => {
      const res = successResponse({ users: [{ id: "1", name: "Alice" }] }, "Users fetched", 200);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.users).toBeDefined();
      expect(json.message).toBe("Users fetched");
    });

    it("should build paginatedResponse correctly", async () => {
      const items = [{ id: "1" }, { id: "2" }];
      const meta = buildPaginationMeta(20, 1, 2);
      const res = paginatedResponse(items, meta);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toHaveLength(2);
      expect(json.pagination.totalPages).toBe(10);
    });

    it("should handle AppError in handleApiError with appropriate status code", async () => {
      const res = handleApiError(new NotFoundError("Course 404"), "TestContext");
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.code).toBe("NOT_FOUND");
      expect(json.message).toBe("Course 404");
    });
  });
});
