import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import * as SettingsService from "@/server/services/settings.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["super_admin", "admin"]);
    const result = await SettingsService.getSettings();
    return successResponse(result, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/settings");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(req, ["super_admin", "admin"]);
    const body = await req.json();
    const result = await SettingsService.updateSettings(body);

    return successResponse(result, "Settings saved successfully.", 200);
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/settings");
  }
}
