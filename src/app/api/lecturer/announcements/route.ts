import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { BadRequestError } from "@/server/core/errors";
import * as AnnouncementService from "@/server/services/announcement.service";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const body = await req.json();

    if (!body.courseId || !body.message) {
      throw new BadRequestError("Missing required fields (courseId, message)");
    }

    const announcement = await AnnouncementService.createAnnouncement(authUser.id, body);

    return successResponse(
      { announcement },
      "Announcement posted successfully",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/lecturer/announcements");
  }
}
