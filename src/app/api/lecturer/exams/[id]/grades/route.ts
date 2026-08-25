import { NextRequest } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import * as ExamService from "@/services/exam.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const { id } = await params;
    const result = await ExamService.getExamGradingRoster(id, authUser.id, authUser.name || "");
    return successResponse(result, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/lecturer/exams/[id]/grades");
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const { id } = await params;
    const body = await req.json();
    const result = await ExamService.saveExamGrades(id, authUser.id, authUser.name || "", body);
    return successResponse(
      result,
      body.sendToStudents
        ? "Exam marks saved and published to students successfully!"
        : "Exam marks saved as draft successfully!",
      200
    );
  } catch (error) {
    return handleApiError(error, "POST /api/lecturer/exams/[id]/grades");
  }
}
