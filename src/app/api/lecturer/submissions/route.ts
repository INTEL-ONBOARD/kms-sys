import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Submission from "@/models/Submission";
import Assignment from "@/models/Assignment";
import Notification from "@/models/Notification";

// POST: Create a new submission (student workflow)
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { assignmentId, courseId, content, files } = body;

    if (!assignmentId || !courseId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    const submission = await Submission.create({
      assignmentId,
      studentId: token.id,
      courseId,
      content: content || "",
      files: files || [],
      submittedAt: new Date(),
      status: "submitted",
    });

    // Auto-increment submissionsCount on the Assignment document
    await Assignment.findByIdAndUpdate(assignmentId, { $inc: { submissionsCount: 1 } });

    return NextResponse.json({ message: "Submission created successfully", submission }, { status: 201 });
  } catch (error: any) {
    console.error("Submission POST API Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

// PATCH: Grade a submission (lecturer workflow)
export async function PATCH(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || (token.role !== "lecturer" && token.role !== "super_admin")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { submissionId, grade, feedback } = body;

    if (!submissionId || grade === undefined || grade === null) {
      return NextResponse.json({ message: "Missing submissionId or grade" }, { status: 400 });
    }

    await connectToDatabase();

    const existingSub = await Submission.findById(submissionId);
    if (!existingSub) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }

    const wasUngraded = existingSub.grade === null;

    existingSub.grade = Number(grade);
    existingSub.feedback = feedback || "";
    existingSub.status = "graded";
    await existingSub.save();

    // If it was previously ungraded and now graded, increment Assignment.gradedCount
    if (wasUngraded) {
      await Assignment.findByIdAndUpdate(existingSub.assignmentId, { $inc: { gradedCount: 1 } });
    }

    // Create notification for student
    await Notification.create({
      userId: existingSub.studentId,
      type: "grading",
      message: `Your submission has been graded: ${existingSub.grade} points`,
      link: `/student`,
    });

    return NextResponse.json({ message: "Submission graded successfully", submission: existingSub });
  } catch (error: any) {
    console.error("Submission PATCH API Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
