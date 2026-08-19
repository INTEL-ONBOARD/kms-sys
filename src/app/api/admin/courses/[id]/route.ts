import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import * as CourseService from "@/server/services/course.service";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ["super_admin", "admin", "lecturer"]);
    const { id } = await params;
    const body = await req.json();
    const updatedCourse = await CourseService.updateCourse(id, body);

    return successResponse({ course: updatedCourse }, "Course updated successfully", 200);
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/courses/[id]");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ["super_admin", "admin"]);
    const { id } = await params;
    await CourseService.deleteCourse(id);

    return successResponse(undefined, "Course deleted successfully", 200);
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/courses/[id]");
  }
}