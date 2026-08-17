import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import LiveClass from "@/models/LiveClass";
import Notification from "@/models/Notification";
import Enrollment from "@/models/Enrollment";

// GET: Fetch live classes for lecturer (all or filtered by date)
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
    const dateParam = searchParams.get("date");
    const fetchAll = searchParams.get("all") === "true";

    const userId = token.id;
    const userName = token.name || "";

    const courses = await Course.find({
      $or: [
        { instructorId: userId },
        { instructor: { $regex: new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } }
      ]
    }).lean();

    const courseIds = courses.map((c) => c._id);

    let query: any = { courseId: { $in: courseIds } };

    if (dateParam) {
      const queryDate = new Date(dateParam);
      const dayStart = new Date(queryDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(queryDate);
      dayEnd.setHours(23, 59, 59, 999);

      query.startTime = { $gte: dayStart, $lte: dayEnd };
    } else if (!fetchAll) {
      // Default to today if not requesting all
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      query.startTime = { $gte: todayStart, $lte: todayEnd };
    }

    const schedule = await LiveClass.find(query)
      .populate("courseId", "title category")
      .sort({ startTime: 1 })
      .lean();

    return NextResponse.json({ schedule });
  } catch (error: any) {
    console.error("Lecturer Schedule API Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

// POST: Schedule a new live class
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
    const { title, courseId, date, time, duration, meetingLink } = body;

    if (!title) {
      return NextResponse.json({ message: "Class title is required" }, { status: 400 });
    }

    await connectToDatabase();

    const userId = token.id;
    const userName = token.name || "";

    // Find lecturer's courses
    const lecturerCourses = await Course.find({
      $or: [
        { instructorId: userId },
        { instructor: { $regex: new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } }
      ]
    }).lean();

    let targetCourseId = courseId;
    if (!targetCourseId && lecturerCourses.length > 0) {
      targetCourseId = lecturerCourses[0]._id;
    }

    if (!targetCourseId) {
      const anyCourse = await Course.findOne().lean();
      if (anyCourse) {
        targetCourseId = anyCourse._id;
      } else {
        const defaultCourse = await Course.create({
          title: "General Lecture Course",
          instructor: userName || "Lecturer",
          instructorId: userId,
          category: "General",
          price: "Free",
          published: true,
        });
        targetCourseId = defaultCourse._id;
      }
    }

    // Calculate start time & end time
    let startTimeDate = new Date();
    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      if (year && month && day) {
        startTimeDate = new Date(year, month - 1, day);
      }
    }

    if (time) {
      const [hours, minutes] = time.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        startTimeDate.setHours(hours, minutes, 0, 0);
      }
    }

    const classDuration = Number(duration) || 60; // in minutes
    const endTimeDate = new Date(startTimeDate.getTime() + classDuration * 60 * 1000);

    const liveClass = await LiveClass.create({
      title,
      courseId: targetCourseId,
      startTime: startTimeDate,
      endTime: endTimeDate,
      meetingLink: meetingLink || "https://meet.google.com/demo-room",
      status: "upcoming",
    });

    // Notify enrolled students
    const enrollments = await Enrollment.find({ courseId: targetCourseId }).lean();
    if (enrollments.length > 0) {
      const notifications = enrollments.map((e) => ({
        userId: e.userId,
        type: "system",
        message: `New Live Class scheduled: "${title}" at ${startTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        link: "/student",
      }));
      await Notification.insertMany(notifications);
    }

    return NextResponse.json(
      { message: "Live Class scheduled successfully", liveClass },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Schedule Live Class POST Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
