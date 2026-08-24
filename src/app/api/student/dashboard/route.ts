import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import * as EnrollmentService from "@/services/enrollment.service";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const dashboardData = await EnrollmentService.getStudentDashboard(authUser.id);
    return successResponse(dashboardData, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/student/dashboard");
  }
}
