import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Assignment from "@/models/Assignment";

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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;

    const userId = (token.id || token.sub) as string;
    const userName = token.name || "";

    let query: any = {
      $or: [
        { instructorId: userId },
        { instructor: { $regex: new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } }
      ]
    };

    let total = await Course.countDocuments(query);
    let courses = await Course.find(query).skip(skip).limit(limit).lean();

    if (total === 0) {
      total = await Course.countDocuments();
      courses = await Course.find().skip(skip).limit(limit).lean();
    }

    const courseIds = courses.map((c) => c._id);

    const [enrollmentStats, assignments] = await Promise.all([
      Enrollment.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: "$courseId", count: { $sum: 1 }, avgProgress: { $avg: "$progress" } } }
      ]),
      Assignment.find({ courseId: { $in: courseIds } }).lean()
    ]);

    const statsMap = new Map();
    enrollmentStats.forEach((e: any) => {
      statsMap.set(e._id.toString(), { count: e.count, avgProgress: Math.round(e.avgProgress || 0) });
    });

    const data = courses.map((course: any) => {
      const stats = statsMap.get(course._id.toString()) || { count: 0, avgProgress: 0 };
      const courseAssignments = assignments.filter((a: any) => a.courseId.toString() === course._id.toString()).length;

      return {
        ...course,
        _id: course._id.toString(),
        assessmentItems: course.assessmentItems && course.assessmentItems.length > 0
          ? course.assessmentItems
          : [
              { name: "Assignments", type: "assignment", weight: course.gradingBreakdown?.assignmentsWeight ?? 20 },
              { name: "Course work 1", type: "coursework", weight: course.gradingBreakdown?.courseWorkWeight ?? 30 },
              { name: "Final exam", type: "exam", weight: course.gradingBreakdown?.finalExamWeight ?? 40 },
              { name: "Attendance", type: "attendance", weight: course.gradingBreakdown?.attendanceWeight ?? 10 },
            ],
        gradingBreakdown: course.gradingBreakdown || {
          assignmentsWeight: 20,
          courseWorkWeight: 30,
          finalExamWeight: 40,
          attendanceWeight: 10,
        },
        studentCount: stats.count,
        avgCompletion: stats.avgProgress,
        assignmentCount: courseAssignments,
      };
    });

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + data.length < total,
      },
    });
  } catch (error: any) {
    console.error("Lecturer Courses API Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
