import { NextRequest } from "next/server";
import { requireAuth } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import * as NotificationService from "@/server/services/notification.service";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const result = await NotificationService.getUserNotifications(authUser.id, 20);
    return successResponse(result, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/lecturer/notifications");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await NotificationService.markNotificationsAsRead(authUser.id);
    return successResponse(undefined, "All notifications marked as read", 200);
  } catch (error) {
    return handleApiError(error, "PATCH /api/lecturer/notifications");
  }
}
