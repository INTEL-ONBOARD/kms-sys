import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { connectToDatabase } from "@/lib/db";
import Batch from "@/models/Batch";
import Enrollment from "@/models/Enrollment";
import { BadRequestError, NotFoundError } from "@/server/core/errors";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    // 1. Ensure the user has administrative privileges
    await requireRole(req, ["super_admin", "admin"]);
    
    // 2. Parse and validate incoming payload
    const body = await req.json();
    const { batchId, courseId } = body;
    
    if (!batchId || !courseId) {
      throw new BadRequestError("batchId and courseId are required");
    }

    if (!mongoose.Types.ObjectId.isValid(batchId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new BadRequestError("Invalid batchId or courseId format");
    }

    // 3. Connect to MongoDB
    await connectToDatabase();
    
    // 4. Fetch the Batch to get the list of students
    const batch = await Batch.findById(batchId).lean();
    if (!batch) {
      throw new NotFoundError("Batch not found");
    }
    
    const studentIds = batch.students || [];
    if (studentIds.length === 0) {
      return successResponse(
        { enrolledCount: 0, skippedCount: 0 },
        "The selected batch has no students.",
        200
      );
    }

    // 5. Query existing enrollments to find students already enrolled in this course
    const existingEnrollments = await Enrollment.find({
      courseId,
      userId: { $in: studentIds }
    }).select("userId").lean();
    
    // Create a Set of existing student IDs for fast lookup
    const existingStudentIdSet = new Set(
      existingEnrollments.map((e) => e.userId.toString())
    );

    // 6. Filter to find only new students who need to be enrolled
    const newStudentsToEnroll = studentIds.filter(
      (studentId) => !existingStudentIdSet.has(studentId.toString())
    );

    const skippedCount = existingStudentIdSet.size;
    let enrolledCount = 0;

    // 7. Bulk insert new enrollments if there are any
    if (newStudentsToEnroll.length > 0) {
      const enrollmentsToCreate = newStudentsToEnroll.map((userId) => ({
        userId,
        courseId,
        progress: 0
      }));
      
      await Enrollment.insertMany(enrollmentsToCreate);
      enrolledCount = enrollmentsToCreate.length;
    }
    
    return successResponse(
      { enrolledCount, skippedCount },
      `Successfully enrolled ${enrolledCount} students. Skipped ${skippedCount} students who were already enrolled.`,
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/admin/enrollments/bulk");
  }
}
