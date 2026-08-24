import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import * as NotificationService from "@/services/notification.service";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const result = await NotificationService.getUserNotifications(authUser.id, 30);
    return successResponse(result, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/notifications");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const { notificationId } = body;

    const result = await NotificationService.markNotificationsAsRead(
      authUser.id,
      notificationId
    );

    return successResponse(result, result.message, 200);
  } catch (error) {
    return handleApiError(error, "PATCH /api/notifications");
  }
}
