import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/core/auth-context";
import { validateBody } from "@/lib/core/validator";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { updateUserSchema } from "@/types/dtos/user.dto";
import * as UserService from "@/services/user.service";
import { logAuditAction } from "@/lib/auditLogger";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requirePermission(req, "user.manage");
    const { id } = await params;
    const body = await validateBody(req, updateUserSchema);

    const oldUser = await UserService.getUserById(id);
    const updatedUser = await UserService.updateUser(id, body);

    if (body.role || body.status) {
      await logAuditAction({
        action: "UPDATE_USER_ROLE_OR_STATUS",
        performedBy: authUser.id,
        targetId: id,
        resourceType: "User",
        details: {
          oldRole: oldUser.role,
          newRole: body.role,
          oldStatus: oldUser.status,
          newStatus: body.status,
        },
      });
    }

    return successResponse({ user: updatedUser }, "User updated", 200);
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/users/[id]");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requirePermission(req, "user.manage");
    const { id } = await params;

    const userToDelete = await UserService.getUserById(id);
    await UserService.deleteUser(id);

    await logAuditAction({
      action: "DELETE_USER",
      performedBy: authUser.id,
      targetId: id,
      resourceType: "User",
      details: {
        deletedUserName: userToDelete.name,
        deletedUserEmail: userToDelete.email,
        deletedUserRole: userToDelete.role,
      },
    });

    return successResponse(undefined, "User deleted successfully", 200);
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/users/[id]");
  }
}