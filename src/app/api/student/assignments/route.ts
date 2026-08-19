import { NextRequest } from "next/server";
import { requireAuth } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import * as AssignmentService from "@/server/services/assignment.service";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const result = await AssignmentService.getStudentAssignments(authUser.id);
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
