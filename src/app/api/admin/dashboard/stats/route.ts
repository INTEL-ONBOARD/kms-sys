import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import * as DashboardService from "@/server/services/dashboard.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["super_admin", "admin"]);
    const stats = await DashboardService.getAdminDashboardStats();
    return successResponse(stats, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/dashboard/stats");
  }
}
