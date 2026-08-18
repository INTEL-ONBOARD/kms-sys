import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import Announcement from "@/models/Announcement";
import Notification from "@/models/Notification";
import Enrollment from "@/models/Enrollment";

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
    const { courseId, message, notifyStudents, attachments } = body;

    if (!courseId || !message) {
      return NextResponse.json({ message: "Missing required fields (courseId, message)" }, { status: 400 });
    }

    await connectToDatabase();

    // Verify course ownership or super_admin access
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    const newAnnouncement = await Announcement.create({
      courseId,
      lecturerId: token.id,
      message,
      notifyStudents: !!notifyStudents,
      attachments: attachments || [],
    });

    // If notifyStudents option enabled, create notifications for enrolled students
    if (notifyStudents) {
      const enrollments = await Enrollment.find({ courseId }).lean();
      const notificationsToCreate = enrollments.map((e) => ({
        userId: e.userId,
        type: "announcement",
        message: `New Announcement in ${course.title}: ${message.substring(0, 50)}...`,
        link: `/student`,
      }));

      if (notificationsToCreate.length > 0) {
        await Notification.insertMany(notificationsToCreate);
      }
    }

    return NextResponse.json(
      { message: "Announcement posted successfully", announcement: newAnnouncement },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Post Announcement API Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
