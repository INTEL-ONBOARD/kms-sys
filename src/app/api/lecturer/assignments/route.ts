import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { parsePaginationParams } from "@/server/core/pagination";
import { paginatedResponse, successResponse, handleApiError } from "@/server/core/api-response";
import * as AssignmentService from "@/server/services/assignment.service";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const pagination = parsePaginationParams(req, 15, 100);
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;

    const result = await AssignmentService.getLecturerAssignments(
      authUser.id,
      authUser.name || "",
      pagination,
      category
    );

    return paginatedResponse(result.assignments, result.pagination, undefined, {
      assignments: result.assignments,
      courses: result.courses,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/lecturer/assignments");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const body = await req.json();

    const assignment = await AssignmentService.createAssignment(
      authUser.id,
      authUser.name || "",
      body
    );

    return successResponse({ assignment }, "Assignment created successfully", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/lecturer/assignments");
  }
}
