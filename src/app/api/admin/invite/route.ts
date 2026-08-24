import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/core/auth-context";
import { validateBody } from "@/lib/core/validator";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { inviteUserSchema } from "@/types/dtos/user.dto";
import * as UserService from "@/services/user.service";

export async function POST(req: NextRequest) {
  try {
    await requirePermission(req, "user.manage");
    const body = await validateBody(req, inviteUserSchema);
    const result = await UserService.inviteUser(body);

    return successResponse(
      { userId: result.user._id, activationToken: result.activationToken },
      "Invitation processed successfully.",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/admin/invite");
  }
}
