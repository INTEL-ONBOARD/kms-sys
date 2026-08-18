import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import Assignment from "@/models/Assignment";
import Exam from "@/models/Exam";
import LiveClass from "@/models/LiveClass";
import CourseMaterial from "@/models/CourseMaterial";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || (!token.sub && !token.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const userId = (token.id || token.sub) as string;
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    // 1. Get ONLY explicitly enrolled courses with progress
    const enrollments = await Enrollment.find({
      $or: [{ userId: userObjectId }, { userId: userId }]
    })
      .populate("courseId", "title instructor category")
      .sort({ createdAt: -1 })
      .lean();

    const validEnrollments = enrollments.filter((e) => e.courseId != null);
    const courseIds = validEnrollments.map((e) => e.courseId?._id?.toString()).filter(Boolean);

    // 2. Get upcoming assignments for enrolled courses
    const now = new Date();
    const assignments = courseIds.length > 0 ? await Assignment.find({
      courseId: { $in: courseIds },
      dueDate: { $gte: now },
      status: "open",
    })
      .populate("courseId", "title")
      .sort({ dueDate: 1 })
      .limit(10)
      .lean() : [];

    // 3. Get upcoming exams for enrolled courses
    const exams = courseIds.length > 0 ? await Exam.find({
      courseId: { $in: courseIds },
      date: { $gte: now },
      status: { $in: ["scheduled", "ongoing"] },
    })
      .populate("courseId", "title")
      .sort({ date: 1 })
      .limit(10)
      .lean() : [];

    // 4. Get live/upcoming classes for enrolled courses
    const liveClasses = courseIds.length > 0 ? await LiveClass.find({
      courseId: { $in: courseIds },
      endTime: { $gte: now },
      status: { $in: ["upcoming", "live"] },
    })
      .populate("courseId", "title")
      .sort({ startTime: 1 })
      .limit(10)
      .lean() : [];

    // 5. Get recent course materials for enrolled courses
    const materials = courseIds.length > 0 ? await CourseMaterial.find({
      courseId: { $in: courseIds },
      isPublished: true,
    })
      .populate("courseId", "title")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean() : [];

    return NextResponse.json(
      {
        enrollments: validEnrollments,
        assignments,
        exams,
        liveClasses,
        materials,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Dashboard Fetch Error:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard data", error: error.message },
      { status: 500 }
    );
  }
}
