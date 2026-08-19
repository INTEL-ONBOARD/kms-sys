import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { validateBody } from "@/server/core/validator";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { generateUploadUrlSchema } from "@/server/dtos/material.dto";
import * as MaterialService from "@/server/services/material.service";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["student", "lecturer", "super_admin", "admin"]);
    const body = await validateBody(req, generateUploadUrlSchema);
    const result = await MaterialService.generateUploadUrl(body, {
      id: authUser.id,
      role: authUser.role,
      name: authUser.name || undefined,
    });

    return successResponse(result, undefined, 200);
  } catch (error) {
    return handleApiError(error, "POST /api/materials/generate-upload-url");
  }
}
