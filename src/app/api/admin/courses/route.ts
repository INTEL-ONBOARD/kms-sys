import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { validateBody } from "@/server/core/validator";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { createCourseSchema } from "@/server/dtos/course.dto";
import * as CourseService from "@/server/services/course.service";

export async function GET(req: NextRequest) {
  try {
    const { courses } = await CourseService.getCourses();
    return successResponse({ courses }, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/courses");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["super_admin", "admin", "lecturer"]);
    const body = await validateBody(req, createCourseSchema);
    const newCourse = await CourseService.createCourse(body, authUser.id);

    return successResponse({ course: newCourse }, "Course created", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/admin/courses");
  }
}