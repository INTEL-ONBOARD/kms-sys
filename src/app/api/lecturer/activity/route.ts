import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import Submission from "@/models/Submission";
import Announcement from "@/models/Announcement";

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
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentSubmissions, recentAnnouncements, gradedSubmissions] = await Promise.all([
      Submission.find({ courseId: { $in: courseIds }, createdAt: { $gte: sevenDaysAgo } })
        .populate("studentId", "name")
        .populate("courseId", "title")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Announcement.find({ courseId: { $in: courseIds }, createdAt: { $gte: sevenDaysAgo } })
        .populate("courseId", "title")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Submission.find({ courseId: { $in: courseIds }, grade: { $ne: null }, updatedAt: { $gte: sevenDaysAgo } })
        .populate("studentId", "name")
        .populate("courseId", "title")
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const activities: any[] = [];

    recentSubmissions.forEach((sub: any) => {
      activities.push({
        id: `sub-${sub._id}`,
        type: "submission",
        title: `${sub.studentId?.name || 'A student'} submitted an assignment`,
        courseTitle: sub.courseId?.title || "Course",
        timestamp: sub.createdAt,
      });
    });

    recentAnnouncements.forEach((anc: any) => {
      activities.push({
        id: `anc-${anc._id}`,
        type: "announcement",
        title: `Announcement: ${anc.message.substring(0, 45)}...`,
        courseTitle: anc.courseId?.title || "Course",
        timestamp: anc.createdAt,
      });
    });

    gradedSubmissions.forEach((grd: any) => {
      activities.push({
        id: `grd-${grd._id}`,
        type: "graded",
        title: `Graded ${grd.studentId?.name || 'student'}'s submission (${grd.grade} pts)`,
        courseTitle: grd.courseId?.title || "Course",
        timestamp: grd.updatedAt,
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ activity: activities.slice(0, 10) });
  } catch (error: any) {
    console.error("Lecturer Activity API Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
