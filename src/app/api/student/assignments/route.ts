import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import * as AssignmentService from "@/services/assignment.service";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const courseFilter = searchParams.get("courseId") || searchParams.get("course") || undefined;
    const search = searchParams.get("search") || searchParams.get("q") || undefined;
    const status = searchParams.get("status") || searchParams.get("tab") || undefined;

    const result = await AssignmentService.getStudentAssignments(
      authUser.id,
      courseFilter,
      search,
      status
    );
    return successResponse(result, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/student/assignments");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json();
    const result = await AssignmentService.submitAssignment(authUser.id, body);
    return successResponse(result, result.message, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/student/assignments");
  }
}
