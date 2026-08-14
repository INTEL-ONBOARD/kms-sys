import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import Submission from "@/models/Submission";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || (token.role !== "lecturer" && token.role !== "super_admin")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const userId = token.id;
    const userName = token.name || "";

    const courses = await Course.find({
      $or: [
        { instructorId: userId },
        { instructor: { $regex: new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } }
      ]
    }).lean();

    const courseIds = courses.map((c) => c._id);

    const pendingSubmissions = await Submission.find({
      courseId: { $in: courseIds },
      grade: null,
    })
      .populate("assignmentId", "title dueDate maxPoints")
      .populate("studentId", "name email")
      .populate("courseId", "title")
      .sort({ submittedAt: 1 })
      .lean();

    // Sort overdue items first
    const sortedQueue = pendingSubmissions.map((sub: any) => {
      const dueDate = sub.assignmentId?.dueDate ? new Date(sub.assignmentId.dueDate) : new Date();
      const isOverdue = dueDate.getTime() < Date.now();
      const overdueDays = isOverdue ? Math.max(1, Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))) : 0;

      return {
        _id: sub._id.toString(),
        assignmentTitle: sub.assignmentId?.title || "Untitled Assignment",
        courseTitle: sub.courseId?.title || "General Course",
        studentName: sub.studentId?.name || "Student",
        studentEmail: sub.studentId?.email || "",
        dueDate: dueDate.toISOString(),
        isOverdue,
        overdueDays,
        submittedAt: sub.submittedAt,
        content: sub.content,
        files: sub.files || [],
      };
    }).sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return NextResponse.json({ queue: sortedQueue });
  } catch (error: any) {
    console.error("Lecturer Grading Queue API Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
