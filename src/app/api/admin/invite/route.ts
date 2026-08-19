import { NextRequest } from "next/server";
import { requirePermission } from "@/server/core/auth-context";
import { validateBody } from "@/server/core/validator";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { inviteUserSchema } from "@/server/dtos/user.dto";
import * as UserService from "@/server/services/user.service";

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
