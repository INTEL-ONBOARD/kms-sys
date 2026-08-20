import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { connectToDatabase } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import { BadRequestError } from "@/server/core/errors";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ["super_admin", "admin"]);
    
    const body = await req.json();
    const { userId, courseId } = body;
    
    if (!userId || !courseId) {
      throw new BadRequestError("userId and courseId are required");
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new BadRequestError("Invalid userId or courseId format");
    }

    await connectToDatabase();
    
    // Check if the student is already enrolled in this course
    const existingEnrollment = await Enrollment.findOne({ userId, courseId });
    if (existingEnrollment) {
      throw new BadRequestError("This student is already enrolled in this course.");
    }

    // Create the enrollment
    const enrollment = new Enrollment({
      userId,
      courseId,
      progress: 0
    });
    
    await enrollment.save();
    
    return successResponse(
      { enrollment },
      "Successfully enrolled student.",
      201
    );
  } catch (error) {
    return handleApiError(error, "POST /api/admin/enrollments");
  }
}
