import { NextRequest } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { parsePaginationParams } from "@/lib/core/pagination";
import { paginatedResponse, handleApiError } from "@/lib/core/api-response";
import * as CourseService from "@/services/course.service";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const pagination = parsePaginationParams(req, 12, 100);

    const result = await CourseService.getLecturerCourses(
      authUser.id,
      authUser.name || "",
      pagination
    );

    return paginatedResponse(result.data, result.pagination, undefined, {
      courses: result.data,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/lecturer/courses");
  }
}
