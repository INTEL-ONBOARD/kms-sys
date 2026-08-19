import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import * as AnnouncementService from "@/server/services/announcement.service";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const { searchParams } = new URL(req.url);
    const courseIdParam = searchParams.get("courseId");

    const result = await AnnouncementService.getLecturerStudents(
      authUser.id,
      authUser.name || "",
      authUser.role === "super_admin",
      courseIdParam
    );

    return successResponse(result, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/lecturer/students");
  }
}
