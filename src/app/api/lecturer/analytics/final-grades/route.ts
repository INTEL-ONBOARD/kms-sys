import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLecturerFinalGradesRoster } from "@/server/services/dashboard.service";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { UnauthorizedError, ForbiddenError } from "@/server/core/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new UnauthorizedError("Authentication required");
    }

    if (session.user.role !== "lecturer" && session.user.role !== "admin") {
      throw new ForbiddenError("Lecturer access required");
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const grade = searchParams.get("grade") || "ALL";
    const courseId = searchParams.get("courseId") || "ALL";

    const data = await getLecturerFinalGradesRoster(
      session.user.id,
      session.user.name || "",
      {
        search,
        grade,
        courseId,
      }
    );

    return successResponse(data, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/lecturer/analytics/final-grades");
  }
}
