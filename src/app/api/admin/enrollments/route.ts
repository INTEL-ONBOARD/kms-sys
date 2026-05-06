import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import type { EnrollmentInput } from "@/types/lms";

// Import Security and Audit Logger Utilities (Tasks #498 & #500)
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isAuthorized } from "@/lib/permissions";
import { logAuditAction } from "@/lib/auditLogger";

export async function GET(request: NextRequest) {
  try {
    // 1. Security Check: Ensure only authorized admins can view all enrollments
    const session = await getServerSession(authOptions);
    if (!isAuthorized(session?.user, 'user.manage')) {
      return NextResponse.json({ message: "Unauthorized access" }, { status: 403 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const courseId = searchParams.get("courseId");

    const query: Record<string, string> = {};
    if (userId) query.userId = userId;
    if (courseId) query.courseId = courseId;

    const enrollments = await Enrollment.find(query)
      .populate("courseId", "title instructor")
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(enrollments, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch enrollments", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Security Check: Ensure only authorized admins can assign courses
    const session = await getServerSession(authOptions);
    if (!isAuthorized(session?.user, 'user.manage')) {
      return NextResponse.json({ message: "Unauthorized access" }, { status: 403 });
    }

    // 2. Parse and Validate Payload
    const payload = (await request.json()) as Partial<EnrollmentInput>;
    if (!payload.userId || !payload.courseId) {
      return NextResponse.json(
        { message: "userId and courseId are required" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(payload.userId) || !isValidObjectId(payload.courseId)) {
      return NextResponse.json({ message: "Invalid ObjectId values" }, { status: 400 });
    }

    // 3. Connect to DB and Create Enrollment
    await connectToDatabase();
    const enrollment = await Enrollment.create({
      userId: payload.userId,
      courseId: payload.courseId
    });

    // 🔥 TASK #500 IN ACTION: Log the course assignment securely!
    await logAuditAction({
      action: 'ASSIGN_COURSE',
      performedBy: session!.user.id, // The Admin making the assignment
      targetId: payload.userId,      // The User receiving the course
      resourceType: 'User',
      details: {
        enrolledCourseId: payload.courseId,
        enrollmentRecordId: enrollment._id
      }
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    // Handle Duplicate Enrollments Gracefully
    const isDuplicate = String(error).includes("E11000");
    if (isDuplicate) {
      return NextResponse.json({ message: "Already enrolled" }, { status: 409 });
    }

    return NextResponse.json(
      { message: "Failed to create enrollment", error: String(error) },
      { status: 500 }
    );
  }
}