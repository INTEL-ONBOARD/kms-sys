/**
 * @jest-environment node
 */

import {
  AppError,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  ValidationException,
  RateLimitException,
  InternalServerException,
  ErrorCode,
  handleApiError,
  withErrorHandler,
} from "@/errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

describe("Errors & Exceptions Infrastructure (src/errors)", () => {
  describe("Domain Exceptions", () => {
    it("should instantiate RateLimitException with 429", () => {
      const err = new RateLimitException();
      expect(err.statusCode).toBe(429);
      expect(err.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(err.toJSON().statusCode).toBe(429);
    });

    it("should serialize to standard JSON envelope via toJSON()", () => {
      const err = new NotFoundException("User not found");
      const json = err.toJSON();
      expect(json.success).toBe(false);
      expect(json.code).toBe("NOT_FOUND");
      expect(json.statusCode).toBe(404);
      expect(json.message).toBe("User not found");
      expect(json.timestamp).toBeDefined();
    });
  });

  describe("withErrorHandler higher-order wrapper", () => {
    it("should pass through successful responses", async () => {
      const handler = withErrorHandler(async () => {
        return NextResponse.json({ success: true, message: "OK" }, { status: 200 });
      });

      const req = new NextRequest("http://localhost:3000/api/test");
      const res = await handler(req, {});
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("should catch thrown AppError and return appropriate JSON error", async () => {
      const handler = withErrorHandler(async () => {
        throw new ForbiddenException("Access denied to exam records");
      });

      const req = new NextRequest("http://localhost:3000/api/test");
      const res = await handler(req, {});
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.code).toBe("FORBIDDEN");
      expect(body.message).toContain("Access denied");
    });

    it("should catch Zod validation error and return 400", async () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const handler = withErrorHandler(async () => {
        schema.parse({ email: "invalid-email" });
        return NextResponse.json({ success: true });
      });

      const req = new NextRequest("http://localhost:3000/api/test");
      const res = await handler(req, {});
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.code).toBe(ErrorCode.VALIDATION_ERROR);
    });
  });
});
