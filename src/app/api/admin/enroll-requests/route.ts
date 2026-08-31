import { NextRequest } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { connectToDatabase } from "@/lib/db";
import EnrollmentRequest from "@/lib/models/EnrollmentRequest";
// Ensure referenced models are registered in Mongoose
import "@/lib/models/User";
import "@/lib/models/Course";

import { generatePresignedDownloadUrl } from "@/lib/r2";

/**
 * GET /api/admin/enroll-requests
 * Fetches enrollment requests with student and course details for admin review.
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["admin", "super_admin"]);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    const filter: Record<string, any> = {};
    if (statusParam && statusParam !== "all") {
      filter.status = statusParam;
    }

    const [rawRequests, pendingCount, approvedCount, rejectedCount, totalCount] =
      await Promise.all([
        EnrollmentRequest.find(filter)
          .populate("studentId", "name email avatar phone")
          .populate("courseId", "title price capacity enrollments nextBatchStartDate colorCode category")
          .sort({ createdAt: -1 })
          .lean(),
        EnrollmentRequest.countDocuments({ status: "pending" }),
        EnrollmentRequest.countDocuments({ status: "approved" }),
        EnrollmentRequest.countDocuments({ status: "rejected" }),
        EnrollmentRequest.countDocuments({}),
      ]);

    // Enhance each request with a valid signed download URL for direct in-browser viewing
    const requests = await Promise.all(
      rawRequests.map(async (item: any) => {
        let signedSlipUrl = item.paymentSlipUrl;
        let key = item.paymentSlipKey;

        if (!key && item.paymentSlipUrl) {
          const idx = item.paymentSlipUrl.indexOf("payment-slips/");
          if (idx !== -1) {
            key = item.paymentSlipUrl.substring(idx);
          }
        }

        if (key) {
          try {
            signedSlipUrl = await generatePresignedDownloadUrl(key, {
              expiresIn: 3600,
              contentDisposition: "inline",
            });
          } catch (e) {
            console.warn("Could not generate presigned download URL for slip:", e);
            signedSlipUrl = `/api/admin/enroll-requests/${item._id}/slip`;
          }
        } else {
          signedSlipUrl = `/api/admin/enroll-requests/${item._id}/slip`;
        }

        return {
          ...item,
          paymentSlipUrl: signedSlipUrl,
          directSlipApiUrl: `/api/admin/enroll-requests/${item._id}/slip`,
        };
      })
    );

    return successResponse(
      {
        requests,
        stats: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          total: totalCount,
        },
      },
      undefined,
      200
    );
  } catch (error) {
    return handleApiError(error, "GET /api/admin/enroll-requests");
  }
}
