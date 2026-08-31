import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { BadRequestError, NotFoundError, ConflictError } from "@/lib/core/errors";
import { connectToDatabase } from "@/lib/db";
import Course from "@/lib/models/Course";
import Enrollment from "@/lib/models/Enrollment";
import EnrollmentRequest from "@/lib/models/EnrollmentRequest";
import { uploadBufferToR2, getFilePublicUrl } from "@/lib/r2";

/**
 * GET /api/student/enroll-requests
 * Returns the current authenticated student's enrollment requests.
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectToDatabase();

    const requests = await EnrollmentRequest.find({ studentId: authUser.id })
      .populate("courseId", "title category price nextBatchStartDate colorCode")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(requests, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/student/enroll-requests");
  }
}

/**
 * POST /api/student/enroll-requests
 * Handles manual bank payment slip upload and creates a pending enrollment request.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectToDatabase();

    const formData = await req.formData();
    const courseId = formData.get("courseId") as string | null;
    const slipFile = formData.get("slip") as File | null;

    if (!courseId) {
      throw new BadRequestError("Course ID is required");
    }

    if (!slipFile || !(slipFile instanceof File)) {
      throw new BadRequestError("A valid bank payment transfer slip file (PDF or image) is required");
    }

    // 1. Verify Course exists
    const course = await Course.findById(courseId).lean();
    if (!course) {
      throw new NotFoundError("Course not found");
    }

    // 2. Check if student is already actively enrolled
    const existingEnrollment = await Enrollment.findOne({
      $or: [
        { studentId: authUser.id, courseId: course._id, status: "active" },
        { userId: authUser.id, courseId: course._id, status: "active" },
      ],
    }).lean();

    if (existingEnrollment) {
      throw new ConflictError("You are already actively enrolled in this course.");
    }

    // 3. Check if there is an existing pending request for this course
    const existingPendingRequest = await EnrollmentRequest.findOne({
      studentId: authUser.id,
      courseId: course._id,
      status: "pending",
    }).lean();

    if (existingPendingRequest) {
      throw new ConflictError(
        "You already have a pending enrollment request for this course. Please wait for admin review."
      );
    }

    // 4. Validate file type and size (max 10MB) - only .jpeg and .png allowed
    const allowedMimeTypes = ["image/jpeg", "image/png"];
    if (!allowedMimeTypes.includes(slipFile.type)) {
      throw new BadRequestError(
        "Invalid file format. Only .jpeg and .png image files are accepted for payment slips."
      );
    }

    if (slipFile.size > 10 * 1024 * 1024) {
      throw new BadRequestError("File size exceeds the 10MB limit.");
    }

    // 5. Convert file to Buffer and upload to Cloudflare R2
    const fileBytes = await slipFile.arrayBuffer();
    const buffer = Buffer.from(fileBytes);
    const sanitizedFileName = slipFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const r2Key = `payment-slips/${authUser.id}/${Date.now()}-${sanitizedFileName}`;

    await uploadBufferToR2(r2Key, buffer, slipFile.type);
    const paymentSlipUrl = getFilePublicUrl(r2Key);

    // 6. Capture exact next batch start date
    const batchStartDate = course.nextBatchStartDate
      ? new Date(course.nextBatchStartDate)
      : new Date();

    // 7. Save pending EnrollmentRequest in MongoDB
    const enrollmentRequest = await EnrollmentRequest.create({
      studentId: authUser.id,
      courseId: course._id,
      batchStartDate,
      paymentSlipUrl,
      paymentSlipKey: r2Key,
      amount: course.price || "Free",
      status: "pending",
    });

    return successResponse(
      enrollmentRequest,
      "Payment slip submitted successfully. Your enrollment request is under review.",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/student/enroll-requests");
  }
}
