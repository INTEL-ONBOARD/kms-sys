import { NextRequest } from "next/server";
import { successResponse, handleApiError } from "@/server/core/api-response";
import * as UserService from "@/server/services/user.service";

export async function GET() {
  try {
    const { users } = await UserService.getUsers();
    return successResponse(users, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/users");
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    if (!payload.name?.trim() || !payload.email?.trim()) {
      return successResponse(undefined, "name and email are required", 400);
    }

    const user = await UserService.createUser({
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password || "TempPass123!",
      role: payload.role || "student",
    });

    return successResponse(user, undefined, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/users");
  }
}
