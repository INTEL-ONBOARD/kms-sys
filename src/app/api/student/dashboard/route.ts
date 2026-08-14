import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import Assignment from "@/models/Assignment";
import Exam from "@/models/Exam";
import LiveClass from "@/models/LiveClass";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const userId = token.sub;

    // Auto-enroll student in all published courses so new courses appear automatically
    const publishedCourses = await Course.find({ published: true }).lean();
    let currentEnrollments = await Enrollment.find({ userId }).lean();
    const enrolledCourseIds = new Set(currentEnrollments.map((e: any) => e.courseId?.toString()).filter(Boolean));

    for (const pCourse of publishedCourses) {
      if (!enrolledCourseIds.has(pCourse._id.toString())) {
        try {
          await Enrollment.create({
            userId,
            courseId: pCourse._id,
            progress: 0,
          });
        } catch (e) {
          // Ignore duplicate enrollment error if concurrent
        }
      }
    }

    // 1. Get enrolled courses with progress
    const enrollments = await Enrollment.find({ userId })
      .populate("courseId", "title instructor category")
      .sort({ createdAt: -1 })
      .lean();

    const courseIds = enrollments.map((e) => e.courseId?._id?.toString()).filter(Boolean);

    // 2. Get upcoming assignments for enrolled courses
    const now = new Date();
    const assignments = await Assignment.find({
      courseId: { $in: courseIds },
      dueDate: { $gte: now },
      status: "open",
    })
      .populate("courseId", "title")
      .sort({ dueDate: 1 })
      .limit(10)
      .lean();

    // 3. Get upcoming exams for enrolled courses
    const exams = await Exam.find({
      courseId: { $in: courseIds },
      date: { $gte: now },
      status: { $in: ["scheduled", "ongoing"] },
    })
      .populate("courseId", "title")
      .sort({ date: 1 })
      .limit(10)
      .lean();

    // 4. Get live/upcoming classes for enrolled courses
    const liveClasses = await LiveClass.find({
      courseId: { $in: courseIds },
      endTime: { $gte: now },
      status: { $in: ["upcoming", "live"] },
    })
      .populate("courseId", "title")
      .sort({ startTime: 1 })
      .limit(10)
      .lean();

    return NextResponse.json(
      {
        enrollments,
        assignments,
        exams,
        liveClasses,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Student Dashboard API Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard data", error: String(error) },
      { status: 500 }
    );
  }
}
