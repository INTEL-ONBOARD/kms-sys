import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { ForbiddenError } from "@/server/core/errors";
import { successResponse, handleApiError } from "@/server/core/api-response";
import * as CourseService from "@/server/services/course.service";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const course = await CourseService.getCourseById(id);
    return successResponse(course, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/courses/[id]");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(req, ["super_admin", "admin", "lecturer"]);
    const { id } = await params;

    if (authUser.role === "lecturer") {
      const existingCourse = await CourseService.getCourseById(id);
      const isAssigned =
        existingCourse.instructorId?.toString() === authUser.id ||
        (authUser.name && existingCourse.instructor?.toLowerCase() === authUser.name.toLowerCase());
      if (!isAssigned) {
        throw new ForbiddenError("You are not authorized to edit this course.");
      }
    }

    const body = await req.json();
    const course = await CourseService.updateCourse(id, body);
    return successResponse(course, undefined, 200);
  } catch (error) {
    return handleApiError(error, "PUT /api/courses/[id]");
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
    return successResponse(undefined, "Course deleted", 200);
  } catch (error) {
    return handleApiError(error, "DELETE /api/courses/[id]");
  }
}

