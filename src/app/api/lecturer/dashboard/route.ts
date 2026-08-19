import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { handleApiError } from "@/server/core/api-response";
import * as DashboardService from "@/server/services/dashboard.service";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const dashboardData = await DashboardService.getLecturerDashboard(
      authUser.id,
      authUser.name || ""
    );

    return NextResponse.json(dashboardData, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/lecturer/dashboard");
  }
}
