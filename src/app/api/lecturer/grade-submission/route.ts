import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { validateBody } from "@/server/core/validator";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { gradeSubmissionSchema } from "@/server/dtos/assignment.dto";
import * as AssignmentService from "@/server/services/assignment.service";

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const body = await validateBody(req, gradeSubmissionSchema);
    const submission = await AssignmentService.gradeSubmission(body);
    return successResponse({ submission }, "Submission graded successfully", 200);
  } catch (error) {
    return handleApiError(error, "POST /api/lecturer/grade-submission");
  }
}
