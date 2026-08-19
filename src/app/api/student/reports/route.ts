import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { generateCSVReport } from "@/lib/reportGenerator";
import * as ReportService from "@/server/services/report.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    const requestedSemester = searchParams.get("semester") || "All";

    const reportData = await ReportService.getStudentReport(
      authUser.id,
      authUser.name || "",
      requestedSemester
    );

    if (format === "csv") {
      const csvContent = generateCSVReport(reportData as any);
      return new NextResponse("\uFEFF" + csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="student_grade_report_${Date.now()}.csv"`,
        },
      });
    }

    return successResponse(reportData, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/student/reports");
  }
}
