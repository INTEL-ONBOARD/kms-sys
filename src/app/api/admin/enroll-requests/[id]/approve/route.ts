import { NextRequest } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { NotFoundError, BadRequestError, ConflictError } from "@/lib/core/errors";
import { connectToDatabase } from "@/lib/db";
import Course from "@/lib/models/Course";
import Enrollment from "@/lib/models/Enrollment";
import EnrollmentRequest from "@/lib/models/EnrollmentRequest";
import Notification from "@/lib/models/Notification";

/**
 * PUT /api/admin/enroll-requests/[id]/approve
 * Approves a student's enrollment request, creates an active enrollment,
 * checks batch capacity, and increments course enrollment stats.
 */
export async function PUT(
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

    const request = await EnrollmentRequest.findById(id);
    if (!request) {
      throw new NotFoundError("Enrollment request not found");
    }

    if (request.status === "approved") {
      throw new BadRequestError("This enrollment request has already been approved");
    }

    const course = await Course.findById(request.courseId);
    if (!course) {
      throw new NotFoundError("Associated course not found");
    }

    // Check capacity against current active enrollments
    const activeEnrollmentsCount = await Enrollment.countDocuments({
      courseId: course._id,
      status: "active",
    });

    const capacity = course.capacity || 50;
    if (activeEnrollmentsCount >= capacity) {
      throw new ConflictError(
        `Cannot approve request. Course batch has reached its maximum capacity of ${capacity} students.`
      );
    }

    // 1. Mark request as approved
    request.status = "approved";
    request.rejectionReason = "";
    await request.save();

    // 2. Create or activate Enrollment record for student
    const enrollment = await Enrollment.findOneAndUpdate(
      {
        $or: [
          { studentId: request.studentId, courseId: request.courseId },
          { userId: request.studentId, courseId: request.courseId },
        ],
      },
      {
        $set: {
          studentId: request.studentId,
          userId: request.studentId,
          courseId: request.courseId,
          batchStartDate: request.batchStartDate,
          status: "active",
        },
        $setOnInsert: {
          progress: 0,
        },
      },
      { upsert: true, new: true }
    );

    // 3. Increment course enrollment count
    await Course.findByIdAndUpdate(course._id, {
      $inc: { enrollments: 1 },
    });

    // 4. Send in-app notification to student
    try {
      await Notification.create({
        userId: request.studentId,
        type: "enrollment",
        message: `Your payment slip for "${course.title}" was approved! You now have full access to the course batch starting ${new Date(
          request.batchStartDate
        ).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`,
        read: false,
        link: "/courses",
      });
    } catch (notifErr) {
      console.warn("Could not create student approval notification:", notifErr);
    }

    return successResponse(
      { request, enrollment },
      `Enrollment for "${course.title}" has been successfully approved.`,
      200
    );
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/enroll-requests/[id]/approve");
  }
}
