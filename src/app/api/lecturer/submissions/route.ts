import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/core/auth-context";
import { validateBody } from "@/lib/core/validator";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { gradeSubmissionSchema } from "@/types/dtos/assignment.dto";
import * as AssignmentService from "@/services/assignment.service";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json();
    const result = await AssignmentService.submitAssignment(authUser.id, body);
    return successResponse(result, "Submission created successfully", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/lecturer/submissions");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const body = await validateBody(req, gradeSubmissionSchema);
    const submission = await AssignmentService.gradeSubmission(body);
    return successResponse({ submission }, "Submission graded successfully", 200);
  } catch (error) {
    return handleApiError(error, "PATCH /api/lecturer/submissions");
  }
}
