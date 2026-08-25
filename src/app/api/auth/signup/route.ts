import { NextRequest } from "next/server";
import { validateBody } from "@/lib/core/validator";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { signupSchema } from "@/types/dtos/auth.dto";
import * as AuthService from "@/services/auth.service";
import { BadRequestError } from "@/lib/core/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await validateBody(req, signupSchema);
    
    if (body.role === 'student' && body.dob) {
      const dobDate = new Date(body.dob);
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 15);
      
      if (dobDate > minAgeDate) {
        throw new BadRequestError("You must be at least 15 years old to register.");
      }
    }

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