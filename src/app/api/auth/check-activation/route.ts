import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { BadRequestError } from "@/lib/core/errors";
import * as AuthService from "@/services/auth.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      throw new BadRequestError("Token is required.");
    }

    const result = await AuthService.checkActivation(token);
    return successResponse(result, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/auth/check-activation");
  }
}
