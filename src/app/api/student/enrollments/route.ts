import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/core/auth-context";
import { validateBody } from "@/lib/core/validator";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { studentEnrollmentSchema } from "@/types/dtos/course.dto";
import * as EnrollmentService from "@/services/enrollment.service";

/**
 * POST /api/student/enrollments
 * Registers a student into the upcoming batch for a course with instant active status.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const body = await validateBody(req, studentEnrollmentSchema);

    // If studentId is not explicitly provided in the body, default to the authenticated student's ID
    const studentId = body.studentId || authUser.id;

    const enrollment = await EnrollmentService.enrollStudent({
      studentId,
      userId: studentId,
      courseId: body.courseId,
    });

    return successResponse(
      enrollment,
      "Successfully enrolled in the upcoming course batch.",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/student/enrollments");
  }
}
