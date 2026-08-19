import { NextRequest } from "next/server";
import { validateBody } from "@/server/core/validator";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { signupSchema } from "@/server/dtos/auth.dto";
import * as AuthService from "@/server/services/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await validateBody(req, signupSchema);
    const result = await AuthService.signup(body);

    return successResponse(
      result,
      "Registration successful! You can now log in.",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/auth/signup");
  }
}