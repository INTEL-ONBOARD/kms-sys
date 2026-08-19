import { NextRequest } from "next/server";
import { requireAuth } from "@/server/core/auth-context";
import { validateBody } from "@/server/core/validator";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { updateProfileSchema } from "@/server/dtos/user.dto";
import * as UserService from "@/server/services/user.service";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const user = await UserService.getUserById(authUser.id);
    return successResponse({ user }, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/users/me");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const body = await validateBody(req, updateProfileSchema);
    const updatedUser = await UserService.updateProfile(authUser.id, body);
    return successResponse({ user: updatedUser }, "Profile updated successfully", 200);
  } catch (error) {
    return handleApiError(error, "PUT /api/users/me");
  }
}
