import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import * as ScheduleService from "@/server/services/schedule.service";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const fetchAll = searchParams.get("all") === "true";

    const result = await ScheduleService.getLecturerSchedule(
      authUser.id,
      authUser.name || "",
      { dateParam, fetchAll }
    );

    return successResponse(result, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/lecturer/schedule");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const body = await req.json();

    const liveClass = await ScheduleService.createLiveClass(
      authUser.id,
      authUser.name || "",
      body
    );

    return successResponse({ liveClass }, "Live Class scheduled successfully", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/lecturer/schedule");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const body = await req.json();
    const { classId, ...updateFields } = body;

    const liveClass = await ScheduleService.updateLiveClass(classId, updateFields);

    return successResponse(
      { liveClass },
      "Lecture recording & session materials updated successfully",
      200
    );
  } catch (error) {
    return handleApiError(error, "PATCH /api/lecturer/schedule");
  }
}
