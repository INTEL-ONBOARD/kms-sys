import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { handleApiError, successResponse } from "@/lib/core/api-response";
import { NotFoundError, BadRequestError } from "@/lib/core/errors";
import { connectToDatabase } from "@/lib/db";
import EnrollmentRequest from "@/lib/models/EnrollmentRequest";
import { generatePresignedDownloadUrl } from "@/lib/r2";

/**
 * GET /api/admin/enroll-requests/[id]/slip
 * Generates an authenticated pre-signed URL to view or download a student's payment slip.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ["admin", "super_admin"]);
    await connectToDatabase();

    const { id } = await params;
    if (!id) {
      throw new BadRequestError("Enrollment Request ID is required");
    }

    const request = await EnrollmentRequest.findById(id).lean();
    if (!request) {
      throw new NotFoundError("Enrollment request not found");
    }

    let key = request.paymentSlipKey;
    if (!key && request.paymentSlipUrl) {
      const idx = request.paymentSlipUrl.indexOf("payment-slips/");
      if (idx !== -1) {
        key = request.paymentSlipUrl.substring(idx);
      }
    }

    if (!key) {
      throw new NotFoundError("Payment slip file key not found");
    }

    // Generate short-lived presigned GET URL for inline browser display
    const signedUrl = await generatePresignedDownloadUrl(key, {
      expiresIn: 3600,
      contentDisposition: "inline",
    });

    const isJson = req.nextUrl.searchParams.get("json") === "true";
    if (isJson) {
      return successResponse({ url: signedUrl }, undefined, 200);
    }

    // Redirect browser directly to presigned S3/R2 URL
    return NextResponse.redirect(signedUrl, { status: 307 });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/enroll-requests/[id]/slip");
  }
}
