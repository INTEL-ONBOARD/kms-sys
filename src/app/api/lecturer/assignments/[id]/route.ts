import { NextRequest } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { updateAssignmentSchema } from "@/types/dtos/assignment.dto";
import * as AssignmentService from "@/services/assignment.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const { id } = await params;

    const assignment = await AssignmentService.getLecturerAssignments(
      authUser.id,
      authUser.name || "",
      { page: 1, limit: 100, skip: 0, sortBy: "createdAt", sortOrder: -1 }
    );

    const found = assignment.assignments.find((a: any) => a._id.toString() === id);
    if (!found) {
      return handleApiError(new Error("Assignment not found"), "GET /api/lecturer/assignments/[id]");
    }

    return successResponse({ assignment: found }, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/lecturer/assignments/[id]");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const { id } = await params;
    const rawBody = await req.json();

    const validatedBody = updateAssignmentSchema.parse(rawBody);

    const updated = await AssignmentService.updateAssignment(
      id,
      authUser.id,
      authUser.name || "",
      validatedBody
    );

    return successResponse({ assignment: updated }, "Assignment updated successfully", 200);
  } catch (error) {
    return handleApiError(error, "PATCH /api/lecturer/assignments/[id]");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(req, { params });
}
