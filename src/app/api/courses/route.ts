import { NextRequest } from "next/server";
import { validateBody } from "@/server/core/validator";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { createCourseSchema } from "@/server/dtos/course.dto";
import * as CourseService from "@/server/services/course.service";

export async function GET() {
  try {
    const { courses } = await CourseService.getCourses();
    return successResponse(courses, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/courses");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await validateBody(req, createCourseSchema);
    const course = await CourseService.createCourse(body);
    return successResponse(course, undefined, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/courses");
  }
}
