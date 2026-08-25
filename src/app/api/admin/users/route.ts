import { NextRequest } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { validateBody } from "@/lib/core/validator";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { parsePaginationParams } from "@/lib/core/pagination";
import { createUserSchema } from "@/types/dtos/user.dto";
import * as UserService from "@/services/user.service";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["super_admin", "admin"]);
    
    const pagination = parsePaginationParams(req, 100, 200);
    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get("role") || undefined;
    const status = searchParams.get("status") || undefined;
    const department = searchParams.get("department") || undefined;

    const result = await UserService.getUsers(pagination, { role, status, department });
    
    return successResponse(result, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/users");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ["super_admin", "admin"]);
    const body = await validateBody(req, createUserSchema);
    const user = await UserService.createUser(body);
    return successResponse({ user }, "User created successfully", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/admin/users");
  }
}