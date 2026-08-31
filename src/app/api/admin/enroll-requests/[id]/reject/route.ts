import { NextRequest } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { NotFoundError, BadRequestError } from "@/lib/core/errors";
import { connectToDatabase } from "@/lib/db";
import Course from "@/lib/models/Course";
import EnrollmentRequest from "@/lib/models/EnrollmentRequest";
import Notification from "@/lib/models/Notification";

/**
 * PUT /api/admin/enroll-requests/[id]/reject
 * Rejects a student's enrollment request with an optional or required reason.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ["admin", "super_admin"]);
    await connectToDatabase();

    const { id } = await params;
    if (!id) {
      throw new BadRequestError("Enrollment Request ID is required");
    }

    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    const request = await EnrollmentRequest.findById(id);
    if (!request) {
      throw new NotFoundError("Enrollment request not found");
    }

    const course = await Course.findById(request.courseId).lean();
    const courseTitle = course?.title || "your requested course";

    request.status = "rejected";
    request.rejectionReason = reason || "Payment slip could not be verified or was invalid.";
    await request.save();

    // Send in-app notification to student
    try {
      await Notification.create({
        userId: request.studentId,
        type: "enrollment",
        message: `Your payment slip for "${courseTitle}" was rejected. Reason: ${request.rejectionReason}. Please re-upload a clear transfer slip to proceed.`,
        read: false,
        link: "/student/courses",
      });
    } catch (notifErr) {
      console.warn("Could not create student rejection notification:", notifErr);
    }

    return successResponse(
      request,
      `Enrollment request has been rejected.`,
      200
    );
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/enroll-requests/[id]/reject");
  }
}
