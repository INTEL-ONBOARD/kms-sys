import { NextRequest } from "next/server";
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
    const { id } = await params;
    const body = await req.json();
    const course = await CourseService.updateCourse(id, body);
    return successResponse(course, undefined, 200);
  } catch (error) {
    return handleApiError(error, "PUT /api/courses/[id]");
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await CourseService.deleteCourse(id);
    return successResponse(undefined, "Course deleted", 200);
  } catch (error) {
    return handleApiError(error, "DELETE /api/courses/[id]");
  }
}
