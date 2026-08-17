import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";

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
    const courseIdParam = searchParams.get("courseId");

    const userId = token.id;
    const userName = token.name || "";

    // Find lecturer courses
    let courseQuery: any = {
      $or: [
        { instructorId: userId },
        { instructor: { $regex: new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } },
      ],
    };

    if (token.role === "super_admin") {
      courseQuery = {};
    }

    const lecturerCourses = await Course.find(courseQuery).lean();
    const lecturerCourseIds = lecturerCourses.map((c) => c._id);

    // Build enrollment query
    let enrollmentQuery: any = {
      courseId: { $in: lecturerCourseIds },
    };

    if (courseIdParam) {
      enrollmentQuery = {
        courseId: courseIdParam,
      };
    }

    const enrollments = await Enrollment.find(enrollmentQuery)
      .populate({
        path: "userId",
        select: "name email status phone isActivated",
        model: User,
      })
      .populate({
        path: "courseId",
        select: "title category",
        model: Course,
      })
      .sort({ createdAt: -1 })
      .lean();

    const students = enrollments
      .filter((e: any) => e.userId != null)
      .map((e: any) => {
        const user = e.userId;
        const course = e.courseId;
        return {
          id: e._id.toString(),
          studentId: user._id?.toString() || "",
          name: user.name || "Unknown Student",
          email: user.email || "",
          course: course?.title || "Untitled Course",
          courseId: course?._id?.toString() || "",
          courseCategory: course?.category || "",
          progress: e.progress ?? 0,
          status:
            user.status === "active"
              ? "Active"
              : user.status
              ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
              : "Active",
          enrolledAt: e.createdAt,
        };
      });

    return NextResponse.json({ students, total: students.length });
  } catch (error: any) {
    console.error("Lecturer Students API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
