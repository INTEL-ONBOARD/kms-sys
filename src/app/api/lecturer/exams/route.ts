import { NextRequest } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { parsePaginationParams } from "@/lib/core/pagination";
import { paginatedResponse, successResponse, handleApiError } from "@/lib/core/api-response";
import * as ExamService from "@/services/exam.service";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const pagination = parsePaginationParams(req, 15, 100);

    const result = await ExamService.getLecturerExams(
      authUser.id,
      authUser.name || "",
      pagination
    );

    return paginatedResponse(result.exams, result.pagination, undefined, {
      exams: result.exams,
      courses: result.courses,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/lecturer/exams");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const body = await req.json();

    const exam = await ExamService.createExam(
      authUser.id,
      authUser.name || "",
      body
    );

    return successResponse({ exam }, "Exam scheduled successfully", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/lecturer/exams");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const body = await req.json();
    const { examId, ...updateFields } = body;

    const exam = await ExamService.updateExam(examId, updateFields);

    return successResponse(
      { exam },
      updateFields.publishResults
        ? "Exam results published successfully"
        : "Exam parameters updated successfully",
      200
    );
  } catch (error) {
    return handleApiError(error, "PATCH /api/lecturer/exams");
  }
}
