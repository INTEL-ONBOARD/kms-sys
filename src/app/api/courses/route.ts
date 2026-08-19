import { NextRequest } from "next/server";
import { validateBody } from "@/server/core/validator";
import { parsePaginationParams } from "@/server/core/pagination";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { createCourseSchema } from "@/server/dtos/course.dto";
import * as CourseService from "@/server/services/course.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const pagination = parsePaginationParams(req, 20, 100);

    const result = await CourseService.getCourses(pagination, {
      category,
      status,
    });
    return successResponse(result.courses, undefined, 200, {
      pagination: result.pagination,
    });
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
