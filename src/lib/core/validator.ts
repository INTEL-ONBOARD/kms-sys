import { NextRequest } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { BadRequestError } from "./errors";

/**
 * Parses and validates the request body using a Zod schema.
 */
export async function validateBody<T>(req: NextRequest | Request, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    throw new BadRequestError("Invalid JSON in request body");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw result.error;
  }

  return result.data;
}

/**
 * Parses and validates the search parameters from request URL using a Zod schema.
 */
export function validateQuery<T>(req: NextRequest | Request, schema: ZodSchema<T>): T {
  const url = new URL(req.url);
  const queryObj: Record<string, string> = {};
  url.searchParams.forEach((val, key) => {
    queryObj[key] = val;
  });

  const result = schema.safeParse(queryObj);
  if (!result.success) {
    throw result.error;
  }

  return result.data;
}
