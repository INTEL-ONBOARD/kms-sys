import { NextRequest } from "next/server";
import { validateBody } from "@/server/core/validator";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { activateAccountSchema } from "@/server/dtos/auth.dto";
import * as AuthService from "@/server/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await validateBody(req, activateAccountSchema);
    const result = await AuthService.activateAccount(body);

    return successResponse(result, result.message, 200);
  } catch (error) {
    return handleApiError(error, "POST /api/auth/activate");
  }
}
