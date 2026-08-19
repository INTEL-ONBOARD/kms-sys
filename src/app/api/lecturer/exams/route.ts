import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import Exam from "@/models/Exam";
import Notification from "@/models/Notification";
import Enrollment from "@/models/Enrollment";

// GET: Fetch exams for lecturer's courses
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
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;

    const userId = token.id;
    const userName = token.name || "";

    const courses = await Course.find({
      $or: [
        { instructorId: userId },
        { instructor: { $regex: new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } }
      ]
    }).lean();

    const courseIds = courses.map((c) => c._id);

    const total = await Exam.countDocuments({ courseId: { $in: courseIds } });
    const examsDocs = await Exam.find({ courseId: { $in: courseIds } })
      .populate("courseId", "title category assessmentItems")
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich exams with weight from course breakdown
    const exams = examsDocs.map((e: any) => {
      const course = e.courseId;
      let weight: number | null = null;
      if (course?.assessmentItems && Array.isArray(course.assessmentItems)) {
        const match = course.assessmentItems.find(
          (item: any) => item.name?.toLowerCase() === e.title?.toLowerCase()
        );
        if (match) weight = match.weight;
      }
      return {
        ...e,
        weight: weight ?? (e.type === "final" ? 40 : e.type === "midterm" ? 25 : 15),
      };
    });

    return NextResponse.json({
      exams,
      courses: courses.map((c: any) => ({
        _id: c._id,
        title: c.title,
        assessmentItems: (c.assessmentItems || []).filter((i: any) => i.type === "exam"),
      })),
      pagination: { page, limit, total, hasMore: skip + exams.length < total }
    });
  } catch (error: any) {
    console.error("Lecturer Exams GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

// POST: Create a new exam
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
    const { title, courseId, date, duration, location, type } = body;

    if (!title) {
      return NextResponse.json({ message: "Exam title is required" }, { status: 400 });
    }

    await connectToDatabase();

    const userId = token.id;
    const userName = token.name || "";

    let targetCourseId = courseId;
    if (!targetCourseId) {
      const lecturerCourses = await Course.find({
        $or: [
          { instructorId: userId },
          { instructor: { $regex: new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } }
        ]
      }).lean();

      if (lecturerCourses.length > 0) {
        targetCourseId = lecturerCourses[0]._id;
      } else {
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
    }

    // Validate that the exam title is an exam component in Course.assessmentItems
    const courseDoc = await Course.findById(targetCourseId);
    if (courseDoc && courseDoc.assessmentItems && courseDoc.assessmentItems.length > 0) {
      const isConfiguredExam = courseDoc.assessmentItems.some(
        (i: any) => i.name.trim().toLowerCase() === title.trim().toLowerCase() && i.type === "exam"
      );
      if (!isConfiguredExam) {
        const isAssignment = courseDoc.assessmentItems.some(
          (i: any) => i.name.trim().toLowerCase() === title.trim().toLowerCase() && i.type !== "exam"
        );
        if (isAssignment) {
          return NextResponse.json(
            { message: `"${title}" is configured as Coursework/Assignment in the Grade Breakdown. Please create it under Assignment Manager.` },
            { status: 400 }
          );
        }
      }
    }

    if (!date) {
      return NextResponse.json({ message: "Exam date is required" }, { status: 400 });
    }

    const examDate = new Date(date);
    if (isNaN(examDate.getTime())) {
      return NextResponse.json({ message: "Invalid date format" }, { status: 400 });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (examDate < startOfToday) {
      return NextResponse.json(
        { message: "Exam date cannot be in the past. Please select a valid future date." },
        { status: 400 }
      );
    }

    const exam = await Exam.create({
      title: title.trim(),
      courseId: targetCourseId,
      date: examDate,
      duration: Number(duration) || 120,
      location: location || "Online Hall A",
      type: type || "midterm",
      status: "scheduled",
    });

    // Notify enrolled students
    const enrollments = await Enrollment.find({ courseId: targetCourseId }).lean();
    if (enrollments.length > 0) {
      const course = await Course.findById(targetCourseId).lean();
      const courseTitle = course?.title || "Course";
      const notifications = enrollments.map((e) => ({
        userId: e.userId,
        type: "exam",
        message: `New Exam Scheduled: "${title}" in ${courseTitle} on ${examDate.toLocaleDateString()}`,
        link: "/calendar",
      }));
      await Notification.insertMany(notifications);
    }

    return NextResponse.json(
      { message: "Exam scheduled successfully", exam },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Lecturer Exam POST Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

// PATCH: Edit exam parameters or publish results
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
    const { examId, title, date, duration, location, type, status, publishResults } = body;

    if (!examId) {
      return NextResponse.json({ message: "Exam ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const updateFields: any = {};
    if (title) updateFields.title = title;
    if (date) updateFields.date = new Date(date);
    if (duration) updateFields.duration = Number(duration);
    if (location) updateFields.location = location;
    if (type) updateFields.type = type;
    if (status) updateFields.status = status;

    if (publishResults) {
      updateFields.status = "completed";
    }

    const updatedExam = await Exam.findByIdAndUpdate(examId, updateFields, { new: true }).populate("courseId", "title");

    if (!updatedExam) {
      return NextResponse.json({ message: "Exam not found" }, { status: 404 });
    }

    // If publishing results, notify students
    if (publishResults) {
      const enrollments = await Enrollment.find({ courseId: updatedExam.courseId }).lean();
      if (enrollments.length > 0) {
        const notifications = enrollments.map((e) => ({
          userId: e.userId,
          type: "system",
          message: `Results published for Exam: "${updatedExam.title}"`,
          link: "/student",
        }));
        await Notification.insertMany(notifications);
      }
    }

    return NextResponse.json({
      message: publishResults ? "Exam results published successfully" : "Exam parameters updated successfully",
      exam: updatedExam,
    });
  } catch (error: any) {
    console.error("Lecturer Exam PATCH Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
