import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Submission from "@/models/Submission";
import Assignment from "@/models/Assignment";
import Notification from "@/models/Notification";

export async function POST(req: NextRequest) {
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

    if (!submissionId || grade === undefined || grade === null || grade === "") {
      return NextResponse.json({ message: "Missing submissionId or grade" }, { status: 400 });
    }

    const numGrade = Number(grade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
      return NextResponse.json({ message: "Grade must be a number between 0 and 100" }, { status: 400 });
    }

    await connectToDatabase();

    const existingSub = await Submission.findById(submissionId);
    if (!existingSub) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }

    const wasUngraded = existingSub.grade === null;

    existingSub.grade = numGrade;
    existingSub.feedback = feedback || "";
    existingSub.status = "graded";
    await existingSub.save();

    if (wasUngraded) {
      await Assignment.findByIdAndUpdate(existingSub.assignmentId, { $inc: { gradedCount: 1 } });
    }

    // Create notification for student
    const assignmentDoc = await Assignment.findById(existingSub.assignmentId).lean();
    const assignmentTitle = assignmentDoc?.title || "Assignment";
    await Notification.create({
      userId: existingSub.studentId,
      type: "grading",
      message: `Results Published: "${assignmentTitle}" graded (${existingSub.grade} pts)`,
      link: `/assignments`,
    });

    return NextResponse.json({ message: "Submission graded successfully", submission: existingSub });
  } catch (error: any) {
    console.error("Grade Submission API Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
