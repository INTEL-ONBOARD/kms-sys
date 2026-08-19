import { NextRequest } from "next/server";
import { requireAuth } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import * as EnrollmentService from "@/server/services/enrollment.service";

export interface CalendarEvent {
  id: string;
  courseId: string;
  title: string;
  dayOfWeek: string;
  startHour: number;
  durationHours: number;
  startTime: string;
  endTime: string;
  location?: string;
  instructor?: string;
  colorCode: string;
  category?: string;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const result = await EnrollmentService.getStudentCalendar(authUser.id);
    return successResponse(result, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/student/calendar");
  }
}
