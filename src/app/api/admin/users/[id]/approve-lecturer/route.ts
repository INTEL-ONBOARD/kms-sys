import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { NotFoundError, BadRequestError } from "@/server/core/errors";
import { sendLecturerApprovalEmail } from "@/lib/mailer";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ["super_admin", "admin"]);
    const { id } = await params;

    await connectToDatabase();

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.role !== "lecturer") {
      throw new BadRequestError("Only lecturers can be approved through this endpoint");
    }

    if (user.status !== "pending") {
      throw new BadRequestError("Lecturer is not in pending status");
    }

    user.status = "active";
    await user.save();

    // Send email notification (this won't throw if it fails)
    await sendLecturerApprovalEmail(user.email);

    return successResponse({ user }, "Lecturer approved successfully", 200);
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/users/[id]/approve-lecturer");
  }
}
