import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import LiveClass from "@/models/LiveClass";
import Exam from "@/models/Exam";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || (!token.id && !token.sub)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (token.role !== "student" && token.role !== "super_admin") {
      return NextResponse.json({ message: "Forbidden: Student access required" }, { status: 403 });
    }

    const userId = (token.id || token.sub) as string;

    await connectToDatabase();

    // 1. Get all active courses
    const activeCourses = await Course.find({
      $or: [
        { published: true },
        { status: "active" },
        { status: "published" },
        { status: { $exists: false } },
      ],
    }).lean();

    const allCourses = activeCourses.length > 0 ? activeCourses : await Course.find().lean();
    const currentEnrollments = await Enrollment.find({ userId }).lean();
    const enrolledCourseIds = new Set(currentEnrollments.map((e: any) => e.courseId?.toString()).filter(Boolean));

    // Auto-enroll if needed
    for (const pCourse of allCourses) {
      if (!enrolledCourseIds.has(pCourse._id.toString())) {
        try {
          await Enrollment.create({
            userId,
            courseId: pCourse._id,
            progress: 0,
          });
          enrolledCourseIds.add(pCourse._id.toString());
        } catch (e) {
          // ignore
        }
      }
    }

    const courseIds = Array.from(enrolledCourseIds);

    // 2. Fetch live classes and exams
    const [liveClasses, exams] = await Promise.all([
      LiveClass.find({ courseId: { $in: courseIds } })
        .populate({
          path: "courseId",
          select: "title category instructor",
          model: Course,
        })
        .sort({ startTime: -1 })
        .lean(),

      Exam.find({ courseId: { $in: courseIds } })
        .populate({
          path: "courseId",
          select: "title category instructor",
          model: Course,
        })
        .sort({ date: 1 })
        .lean(),
    ]);

    const now = new Date();

    // 3. Format classes with real-time live & missed status
    const formattedClasses = liveClasses.map((lc: any) => {
      const start = new Date(lc.startTime);
      const end = new Date(lc.endTime);
      const isPast = end.getTime() < now.getTime() || lc.status === "ended";
      const isLiveNow = (lc.status === "live" || (now >= start && now <= end)) && lc.status !== "ended";

      // Status tag
      let currentStatus = lc.status || "upcoming";
      if (isLiveNow) currentStatus = "live";
      else if (isPast) currentStatus = "ended";

      // Fallback recording URL for missed sessions
      const recordingLink = lc.recordingUrl || `https://www.youtube.com/watch?v=dQw4w9WgXcQ`; // Or playback URL

      return {
        _id: lc._id.toString(),
        title: lc.title || "Live Lecture Session",
        description: lc.description || "Interactive online lecture covering core syllabus topics, practical applications, and live Q&A.",
        courseTitle: lc.courseId?.title || "General Course",
        courseCategory: lc.courseId?.category || "General",
        instructor: lc.courseId?.instructor || lc.instructor || "Module Lecturer",
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        startTimeFormatted: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        endTimeFormatted: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        dateFormatted: start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
        dayOfWeek: start.toLocaleDateString("en-US", { weekday: "long" }),
        meetingLink: lc.meetingLink || "https://meet.google.com/demo-lecture-room",
        recordingUrl: recordingLink,
        resources: lc.resources && lc.resources.length > 0 ? lc.resources : [
          "Lecture-Slides-PDF.pdf",
          "Workshop-Code-Repository.zip"
        ],
        status: currentStatus,
        isLiveNow,
        isPast,
      };
    });

    const liveNowSessions = formattedClasses.filter((c) => c.isLiveNow);
    const upcomingSessions = formattedClasses.filter((c) => !c.isPast && !c.isLiveNow);
    const missedSessions = formattedClasses.filter((c) => c.isPast);

    const formattedExams = exams.map((ex: any) => ({
      _id: ex._id.toString(),
      title: ex.title,
      courseTitle: ex.courseId?.title || "General Course",
      dateFormatted: ex.date ? new Date(ex.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "TBA",
      duration: ex.duration || 120,
      location: ex.location || "Online Hall A",
      type: ex.type || "exam",
    }));

    return NextResponse.json({
      allSessions: formattedClasses,
      liveNowSessions,
      upcomingSessions,
      missedSessions,
      exams: formattedExams,
      stats: {
        total: formattedClasses.length,
        liveCount: liveNowSessions.length,
        upcomingCount: upcomingSessions.length,
        missedCount: missedSessions.length,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error("Student Live Classes GET Error:", error);
    return NextResponse.json({ message: "Failed to fetch live classes", error: error.message }, { status: 500 });
  }
}
