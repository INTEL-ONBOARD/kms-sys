import { NextRequest } from "next/server";
import { requireAuth } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import * as EnrollmentService from "@/server/services/enrollment.service";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const courseFilter = searchParams.get("courseId") || searchParams.get("course") || undefined;
    const result = await EnrollmentService.getStudentLiveClasses(authUser.id, courseFilter);
    return successResponse(result, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/student/live-classes");
  }
}
