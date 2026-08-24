import { NextRequest } from "next/server";
import { validateBody } from "@/lib/core/validator";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { resetPasswordSchema } from "@/types/dtos/auth.dto";
import * as AuthService from "@/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await validateBody(req, resetPasswordSchema);
    const result = await AuthService.resetPassword(body);

    return successResponse(result, result.message, 200);
  } catch (error) {
    return handleApiError(error, "POST /api/auth/reset-password");
  }
}