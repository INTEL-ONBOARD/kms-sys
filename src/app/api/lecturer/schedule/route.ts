import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import LiveClass from "@/models/LiveClass";
import CourseMaterial from "@/models/CourseMaterial";
import Notification from "@/models/Notification";
import Enrollment from "@/models/Enrollment";
import mongoose from "mongoose";

// Ensure models are registered in Mongoose
Course;
CourseMaterial;
LiveClass;
Enrollment;
Notification;

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

    const userId = (token.id || token.sub) as string;
    const userName = token.name || "";

    const courses = await Course.find({
      $or: [
        { instructorId: userId },
        { instructor: { $regex: new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } }
      ]
    }).lean();

    let courseIds = courses.map((c) => c._id);
    if (courseIds.length === 0) {
      const allCourses = await Course.find().lean();
      courseIds = allCourses.map((c) => c._id);
    }

    let query: any = courseIds.length > 0 ? { courseId: { $in: courseIds } } : {};

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
      .populate({ path: "courseId", model: Course, select: "title category" })
      .populate({ path: "materialId", model: CourseMaterial, select: "title fileName fileUrl fileSize mimeType materialType" })
      .populate({ path: "materials", model: CourseMaterial, select: "title fileName fileUrl fileSize mimeType materialType" })
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
    const { title, courseId, date, time, duration, meetingLink, materialId, materials } = body;

    if (!title) {
      return NextResponse.json({ message: "Class title is required" }, { status: 400 });
    }

    await connectToDatabase();

    const userId = (token.id || token.sub) as string;
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

    const materialsList = Array.isArray(materials) ? materials : (materialId ? [materialId] : []);

    const liveClass = await LiveClass.create({
      title,
      description: body.description || "Interactive online lecture session.",
      courseId: targetCourseId,
      instructor: userName || "Course Lecturer",
      startTime: startTimeDate,
      endTime: endTimeDate,
      meetingLink: meetingLink || "https://meet.google.com/demo-room",
      materialId: materialId || (materialsList[0] ?? undefined),
      materials: materialsList,
      status: "upcoming",
    });

    const populatedLiveClass = await LiveClass.findById(liveClass._id)
      .populate({ path: "courseId", model: Course, select: "title category" })
      .populate({ path: "materialId", model: CourseMaterial, select: "title fileName fileUrl fileSize mimeType materialType" })
      .populate({ path: "materials", model: CourseMaterial, select: "title fileName fileUrl fileSize mimeType materialType" })
      .lean();

    // Notify enrolled students safely
    try {
      const enrollments = await Enrollment.find({ courseId: targetCourseId }).lean();
      if (enrollments.length > 0) {
        const course = await Course.findById(targetCourseId).lean();
        const courseTitle = course?.title || "Course";
        const notifications = enrollments.map((e) => ({
          userId: e.userId,
          type: "class",
          message: `Live Class Scheduled: "${title}" in ${courseTitle} at ${startTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          link: "/calendar",
        }));
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.warn("Could not dispatch notifications:", notifErr);
    }

    return NextResponse.json(
      { message: "Live Class scheduled successfully", liveClass: populatedLiveClass },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Schedule Live Class POST Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

// PATCH: Upload/update missed lecture recording, summary notes, resources, or status
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
    const { classId, recordingUrl, description, resources, materialId, materials, status } = body;

    if (!classId) {
      return NextResponse.json({ message: "classId is required" }, { status: 400 });
    }

    await connectToDatabase();

    const liveClass = await LiveClass.findById(classId);
    if (!liveClass) {
      return NextResponse.json({ message: "Live class not found" }, { status: 404 });
    }

    if (recordingUrl !== undefined) liveClass.recordingUrl = recordingUrl;
    if (description !== undefined) liveClass.description = description;
    if (resources !== undefined) liveClass.resources = resources;
    if (materialId !== undefined) liveClass.materialId = materialId;
    if (materials !== undefined) liveClass.materials = materials;
    if (status !== undefined) liveClass.status = status;

    await liveClass.save();

    // If recording was uploaded/updated, notify enrolled students
    if (recordingUrl) {
      const course = await Course.findById(liveClass.courseId).lean();
      const courseTitle = course?.title || "Course";
      const enrollments = await Enrollment.find({ courseId: liveClass.courseId }).lean();
      if (enrollments.length > 0) {
        const notifications = enrollments.map((e) => ({
          userId: e.userId,
          type: "class",
          message: `Lecture Recording Uploaded: Missed session recording for "${liveClass.title}" in ${courseTitle} is now available in Playback Mode`,
          link: "/calendar",
        }));
        await Notification.insertMany(notifications);
      }
    }

    return NextResponse.json({
      message: "Lecture recording & session materials updated successfully",
      liveClass,
    });
  } catch (error: any) {
    console.error("Update Live Class Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

