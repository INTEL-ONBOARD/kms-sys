import { NextRequest } from "next/server";
import { requirePermission } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { BadRequestError } from "@/server/core/errors";
import { logAuditAction } from "@/lib/auditLogger";
import * as EnrollmentService from "@/server/services/enrollment.service";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await requirePermission(req, "user.manage");
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const courseId = searchParams.get("courseId") || undefined;

    const { enrollments } = await EnrollmentService.getEnrollments(undefined, {
      userId,
      courseId,
    });

    return successResponse(enrollments, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/enrollments");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requirePermission(req, "user.manage");
    const payload = await req.json();

    if (!payload.userId || !payload.courseId) {
      throw new BadRequestError("userId and courseId are required");
    }

    if (
      !mongoose.Types.ObjectId.isValid(payload.userId) ||
      !mongoose.Types.ObjectId.isValid(payload.courseId)
    ) {
      throw new BadRequestError("Invalid ObjectId values");
    }

    const enrollment = await EnrollmentService.enrollStudent({
      userId: payload.userId,
      courseId: payload.courseId,
    });

    await logAuditAction({
      action: "ASSIGN_COURSE",
      performedBy: authUser.id,
      targetId: payload.userId,
      resourceType: "User",
      details: {
        enrolledCourseId: payload.courseId,
        enrollmentRecordId: enrollment._id,
      },
    });

    return successResponse(enrollment, undefined, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/admin/enrollments");
  }
}
