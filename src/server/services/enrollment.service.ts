import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import Assignment from "@/models/Assignment";
import Exam from "@/models/Exam";
import LiveClass from "@/models/LiveClass";
import CourseMaterial from "@/models/CourseMaterial";
import Submission from "@/models/Submission";
import User from "@/models/User";
import Announcement from "@/models/Announcement";
import { BadRequestError, NotFoundError, ConflictError } from "../core/errors";
import { PaginationParams, buildPaginationMeta } from "../core/pagination";
import { EnrollCourseInput } from "../dtos/course.dto";

// Ensure models are registered in Mongoose
Course;
CourseMaterial;
LiveClass;
Exam;
Assignment;
Enrollment;
Submission;
User;
Announcement;

/**
 * Retrieves enrollments for admin/super_admin with populated course and user information.
 */
export async function getEnrollments(pagination?: PaginationParams, filters?: { courseId?: string; userId?: string }) {
  await connectToDatabase();

  const query: Record<string, any> = {};
  if (filters?.courseId) query.courseId = filters.courseId;
  if (filters?.userId) query.userId = filters.userId;

  if (pagination) {
    const total = await Enrollment.countDocuments(query);
    const enrollments = await Enrollment.find(query)
      .populate("userId", "name email role")
      .populate("courseId", "title instructor category price")
      .sort({ [pagination.sortBy || "createdAt"]: pagination.sortOrder })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      enrollments,
      pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  const enrollments = await Enrollment.find(query)
    .populate("userId", "name email role")
    .populate("courseId", "title instructor category price")
    .sort({ createdAt: -1 })
    .lean();

  return { enrollments };
}

/**
 * Enrolls a student in a course.
 */
export async function enrollStudent(input: EnrollCourseInput) {
  await connectToDatabase();

  const userObjectId = mongoose.Types.ObjectId.isValid(input.userId)
    ? new mongoose.Types.ObjectId(input.userId)
    : input.userId;
  const courseObjectId = mongoose.Types.ObjectId.isValid(input.courseId)
    ? new mongoose.Types.ObjectId(input.courseId)
    : input.courseId;

  // Check if course exists
  const course = await Course.findById(courseObjectId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  // Check if already enrolled
  const existing = await Enrollment.findOne({
    $or: [
      { userId: userObjectId, courseId: courseObjectId },
      { userId: input.userId, courseId: input.courseId },
    ],
  });

  if (existing) {
    throw new ConflictError("User is already enrolled in this course");
  }

  const newEnrollment = await Enrollment.create({
    userId: userObjectId,
    courseId: courseObjectId,
    progress: 0,
  });

  // Increment course enrollments count
  await Course.findByIdAndUpdate(courseObjectId, { $inc: { enrollments: 1 } });

  return newEnrollment as any;
}

/**
 * Retrieves the aggregated data needed for the student dashboard.
 */
export async function getStudentDashboard(userId: string) {
  await connectToDatabase();

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  // 1. Get explicitly enrolled courses
  const enrollments = await Enrollment.find({
    $or: [{ userId: userObjectId }, { userId }],
  })
    .populate("courseId", "title instructor category schedule colorCode")
    .sort({ createdAt: -1 })
    .lean();

  const validEnrollments = enrollments.filter((e) => e.courseId != null);
  const courseIds = validEnrollments
    .map((e: any) => e.courseId?._id?.toString())
    .filter(Boolean);
  const courseObjectIds = courseIds.map((id: string) =>
    mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
  );
  const allCourseIds = Array.from(new Set([...courseIds, ...courseObjectIds]));

  const now = new Date();

  // 2. Upcoming assignments for enrolled courses
  const assignments =
    allCourseIds.length > 0
      ? await Assignment.find({
          courseId: { $in: allCourseIds },
          dueDate: { $gte: now },
          status: "open",
        })
          .populate("courseId", "title")
          .sort({ dueDate: 1 })
          .limit(10)
          .lean()
      : [];

  // 3. Upcoming exams for enrolled courses
  const exams =
    allCourseIds.length > 0
      ? await Exam.find({
          courseId: { $in: allCourseIds },
          date: { $gte: now },
          status: { $in: ["scheduled", "ongoing"] },
        })
          .populate("courseId", "title")
          .sort({ date: 1 })
          .limit(10)
          .lean()
      : [];

  // 4. Live / Upcoming classes for enrolled courses
  const liveClasses =
    allCourseIds.length > 0
      ? await LiveClass.find({
          courseId: { $in: allCourseIds },
          status: { $ne: "cancelled" },
          $or: [
            { status: { $in: ["upcoming", "live"] } },
            { endTime: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) } },
          ],
        })
          .populate("courseId", "title category instructor")
          .sort({ startTime: 1 })
          .limit(10)
          .lean()
      : [];

  // 5. Recent course materials
  const materials =
    allCourseIds.length > 0
      ? await CourseMaterial.find({
          courseId: { $in: allCourseIds },
          isPublished: true,
        })
          .populate("courseId", "title")
          .sort({ createdAt: -1 })
          .limit(6)
          .lean()
      : [];

  // 6. Recent Announcements for enrolled courses
  const announcements =
    allCourseIds.length > 0
      ? await Announcement.find({
          courseId: { $in: allCourseIds },
        })
          .populate("courseId", "title")
          .populate("lecturerId", "name email")
          .sort({ createdAt: -1 })
          .limit(6)
          .lean()
      : [];

  // 7. Calculate dynamic Credits, Attendance, and GPA
  let credits = 0;
  let attendance = 0;
  let gpa = "0.0";

  if (validEnrollments.length > 0) {
    credits = validEnrollments.reduce((sum: number, e: any) => {
      const prog = typeof e.progress === "number" ? e.progress : 0;
      return sum + (prog >= 100 ? 4 : Math.floor((prog / 100) * 4));
    }, 0);

    const totalProgress = validEnrollments.reduce(
      (sum: number, e: any) => sum + (typeof e.progress === "number" ? e.progress : 0),
      0
    );
    attendance = Math.round(totalProgress / validEnrollments.length);

    const gradedSubmissions = await Submission.find({
      studentId: { $in: [userObjectId, userId] },
      status: "graded",
      grade: { $ne: null },
    }).lean();

    if (gradedSubmissions.length > 0) {
      const totalPoints = gradedSubmissions.reduce((sum: number, s: any) => {
        const g = typeof s.grade === "number" ? s.grade : 0;
        if (g >= 93) return sum + 4.0;
        if (g >= 88) return sum + 3.7;
        if (g >= 82) return sum + 3.3;
        if (g >= 75) return sum + 3.0;
        if (g >= 70) return sum + 2.7;
        if (g >= 65) return sum + 2.3;
        if (g >= 60) return sum + 2.0;
        return sum + 1.0;
      }, 0);
      gpa = (totalPoints / gradedSubmissions.length).toFixed(1);
    }
  }

  const currentUser = await User.findById(userObjectId).select("name email reportApproved").lean();

  return {
    enrollments: validEnrollments,
    assignments,
    exams,
    liveClasses,
    materials,
    announcements,
    credits,
    gpa,
    attendance,
    reportApproved: !!currentUser?.reportApproved,
  };
}

/**
 * Retrieves courses enrolled by a student.
 */
export async function getStudentCourses(userId: string) {
  await connectToDatabase();

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const enrollments = await Enrollment.find({
    $or: [{ userId: userObjectId }, { userId }],
  })
    .populate("courseId")
    .sort({ createdAt: -1 })
    .lean();

  const courses = enrollments
    .filter((e) => e.courseId != null)
    .map((e: any) => ({
      ...e.courseId,
      progress: e.progress || 0,
      enrolledAt: e.enrolledAt,
    }));

  return { courses, enrollments };
}

/**
 * Retrieves calendar schedule, live classes, and exams for enrolled student courses.
 */
export async function getStudentCalendar(userId: string, courseFilter?: string) {
  await connectToDatabase();

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const enrollments = await Enrollment.find({
    $or: [{ userId: userObjectId }, { userId }],
  })
    .populate("courseId", "title instructor category schedule colorCode code")
    .lean();

  let validCourses = enrollments
    .map((e: any) => e.courseId)
    .filter(Boolean);

  if (courseFilter && courseFilter !== "All" && courseFilter !== "all") {
    validCourses = validCourses.filter((c: any) => {
      const cId = c._id?.toString();
      const title = (c.title || "").toLowerCase();
      const cat = (c.category || "").toLowerCase();
      const code = (c.code || "").toLowerCase();
      const filterLower = courseFilter.toLowerCase();
      return (
        cId === courseFilter ||
        title === filterLower ||
        title.includes(filterLower) ||
        cat === filterLower ||
        code === filterLower
      );
    });
  }

  const courseIds = validCourses.map((c: any) => c._id);

  // 1. Fetch all scheduled Exams for enrolled courses
  const exams =
    courseIds.length > 0
      ? await Exam.find({
          courseId: { $in: courseIds },
          status: { $ne: "cancelled" },
        })
          .populate("courseId", "title colorCode instructor")
          .sort({ date: 1 })
          .lean()
      : [];

  // 2. Fetch all scheduled Live Classes for enrolled courses
  const liveClasses =
    courseIds.length > 0
      ? await LiveClass.find({
          courseId: { $in: courseIds },
          status: { $ne: "cancelled" },
        })
          .populate("courseId", "title colorCode instructor")
          .sort({ startTime: 1 })
          .lean()
      : [];

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const events: any[] = [];

  // Add Recurring Course Schedule Slots
  validCourses.forEach((c: any) => {
    const courseIdStr = c._id.toString();
    const courseTitle = c.title || "Course";
    const colorCode = c.colorCode || "#5A67D8";

    if (Array.isArray(c.schedule)) {
      c.schedule.forEach((slot: any, idx: number) => {
        if (!slot.dayOfWeek || !slot.startTime || !slot.endTime) return;

        let startHour = 9;
        const timeParts = String(slot.startTime).split(":");
        if (timeParts.length >= 1) {
          const parsed = parseInt(timeParts[0], 10);
          if (!isNaN(parsed)) startHour = parsed;
        }

        let endHour = startHour + 1;
        const endParts = String(slot.endTime).split(":");
        if (endParts.length >= 1) {
          const parsedEnd = parseInt(endParts[0], 10);
          if (!isNaN(parsedEnd) && parsedEnd > startHour) {
            endHour = parsedEnd;
          }
        }

        events.push({
          id: `slot-${courseIdStr}-${idx}`,
          courseId: courseIdStr,
          courseTitle,
          title: courseTitle,
          dayOfWeek: slot.dayOfWeek,
          startHour: Math.min(16, Math.max(8, startHour)),
          durationHours: Math.max(1, Math.min(4, endHour - startHour)),
          startTime: slot.startTime,
          endTime: slot.endTime,
          location: slot.location || "Main Lecture Hall",
          instructor: c.instructor || "Faculty Lecturer",
          colorCode,
          category: c.category || "Lecture",
          eventType: "lecture",
        });
      });
    }
  });

  // Add Scheduled Live Classes to Timetable
  liveClasses.forEach((lc: any) => {
    const c = lc.courseId as any;
    const courseIdStr = c?._id?.toString() || lc.courseId?.toString() || "";
    const courseTitle = c?.title || "Live Session";
    const startDate = new Date(lc.startTime);
    const endDate = new Date(lc.endTime);

    const dayOfWeek = daysOfWeek[startDate.getDay()] || "Monday";
    const startHour = startDate.getHours();
    const durationHours = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60))
    );

    const startTimeFormatted = startDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const endTimeFormatted = endDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    events.push({
      id: `live-${lc._id.toString()}`,
      courseId: courseIdStr,
      courseTitle,
      title: lc.title || `${courseTitle} (Live Class)`,
      dayOfWeek,
      startHour: Math.min(16, Math.max(8, startHour)),
      durationHours: Math.min(4, durationHours),
      startTime: startTimeFormatted,
      endTime: endTimeFormatted,
      location: "Online (Live Stream)",
      instructor: lc.instructor || c?.instructor || "Course Lecturer",
      colorCode: "#2563EB",
      category: "Live Class",
      eventType: "live_class",
      meetingLink: lc.meetingLink || "",
      date: startDate.toISOString(),
      dateFormatted: startDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: lc.status || "upcoming",
    });
  });

  // Add Scheduled Exams to Timetable
  exams.forEach((ex: any) => {
    const c = ex.courseId as any;
    const courseIdStr = c?._id?.toString() || ex.courseId?.toString() || "";
    const courseTitle = c?.title || "Exam";
    const examDate = new Date(ex.date);
    const durationMins = Number(ex.duration) || 120;
    const endDate = new Date(examDate.getTime() + durationMins * 60 * 1000);

    const dayOfWeek = daysOfWeek[examDate.getDay()] || "Monday";
    const startHour = examDate.getHours();
    const durationHours = Math.max(1, Math.ceil(durationMins / 60));

    const startTimeFormatted = examDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const endTimeFormatted = endDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    events.push({
      id: `exam-${ex._id.toString()}`,
      courseId: courseIdStr,
      courseTitle,
      title: ex.title || `${courseTitle} Examination`,
      dayOfWeek,
      startHour: Math.min(16, Math.max(8, startHour)),
      durationHours: Math.min(4, durationHours),
      startTime: startTimeFormatted,
      endTime: endTimeFormatted,
      location: ex.location || "Examination Hall",
      instructor: c?.instructor || "Exam Committee",
      colorCode: "#7C3AED",
      category: "Exam",
      eventType: "exam",
      examType: ex.type || "final",
      duration: durationMins,
      date: examDate.toISOString(),
      dateFormatted: examDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: ex.status || "scheduled",
    });
  });

  // Formatted exam objects for direct list views
  const formattedExams = exams.map((ex: any) => {
    const c = ex.courseId as any;
    const examDate = new Date(ex.date);
    return {
      _id: ex._id.toString(),
      title: ex.title,
      courseId: c?._id?.toString() || ex.courseId?.toString() || "",
      courseTitle: c?.title || "Exam Course",
      date: examDate.toISOString(),
      dateFormatted: examDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      timeFormatted: examDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      duration: ex.duration || 120,
      location: ex.location || "Online",
      type: ex.type || "quiz",
      status: ex.status || "scheduled",
    };
  });

  // Formatted live classes objects for direct list views
  const formattedLiveClasses = liveClasses.map((lc: any) => {
    const c = lc.courseId as any;
    const startDate = new Date(lc.startTime);
    const endDate = new Date(lc.endTime);
    return {
      _id: lc._id.toString(),
      title: lc.title,
      courseId: c?._id?.toString() || lc.courseId?.toString() || "",
      courseTitle: c?.title || "Live Course",
      instructor: lc.instructor || c?.instructor || "Course Lecturer",
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      dateFormatted: startDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      timeFormatted: `${startDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })} - ${endDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`,
      meetingLink: lc.meetingLink || "",
      status: lc.status || "upcoming",
    };
  });

  return {
    courses: validCourses,
    events,
    exams: formattedExams,
    liveClasses: formattedLiveClasses,
  };
}

/**
 * Retrieves live classes and recordings for enrolled courses.
 */
export async function getStudentLiveClasses(userId: string, courseFilter?: string) {
  await connectToDatabase();

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const enrollments = await Enrollment.find({
    $or: [{ userId: userObjectId }, { userId }],
  }).lean();

  const courseIds = enrollments.map((e) => e.courseId).filter(Boolean);
  const courseObjectIds = courseIds.map((id: any) =>
    typeof id === "string" && mongoose.Types.ObjectId.isValid(id)
      ? new mongoose.Types.ObjectId(id)
      : id
  );
  let allCourseIds = Array.from(new Set([...courseIds, ...courseObjectIds]));

  // Backend filtering by course if specified
  if (courseFilter && courseFilter !== "All" && courseFilter !== "all") {
    let targetIds: any[] = [];
    if (mongoose.Types.ObjectId.isValid(courseFilter)) {
      targetIds = [new mongoose.Types.ObjectId(courseFilter)];
    } else {
      const escaped = courseFilter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matched = await Course.find({
        $or: [
          { title: { $regex: new RegExp(`^${escaped}$`, "i") } },
          { category: { $regex: new RegExp(`^${escaped}$`, "i") } },
          { code: { $regex: new RegExp(`^${escaped}$`, "i") } },
        ],
      }).select("_id").lean();
      targetIds = matched.map((m: any) => m._id);
    }

    if (targetIds.length > 0) {
      allCourseIds = allCourseIds.filter((cid: any) =>
        targetIds.some((tid) => tid.toString() === cid.toString())
      );
      if (allCourseIds.length === 0) {
        allCourseIds = targetIds;
      }
    }
  }

  const classes = await LiveClass.find({
    courseId: { $in: allCourseIds },
    status: { $ne: "cancelled" },
  })
    .populate("courseId", "title category instructor")
    .populate("materialId", "title fileName fileUrl fileSize mimeType materialType")
    .populate("materials", "title fileName fileUrl fileSize mimeType materialType")
    .sort({ startTime: 1 })
    .lean();

  const now = new Date();
  const allSessions = classes.map((c: any) => {
    const start = new Date(c.startTime);
    const end = new Date(c.endTime);
    const isLiveNow = c.status === "live" || (now >= start && now <= end && c.status !== "ended");
    const isPast = c.status === "ended" || (!isLiveNow && now > end);

    return {
      _id: c._id.toString(),
      title: c.title,
      description: c.description || "",
      courseId: c.courseId?._id?.toString() || c.courseId?.toString() || "",
      courseTitle: c.courseId?.title || "Untitled Course",
      courseCategory: c.courseId?.category || "General",
      instructor: c.instructor || c.courseId?.instructor || "Course Lecturer",
      startTime: c.startTime,
      endTime: c.endTime,
      startTimeFormatted: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      endTimeFormatted: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      dateFormatted: start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      dayOfWeek: start.toLocaleDateString("en-US", { weekday: "long" }),
      meetingLink: c.meetingLink || "",
      recordingUrl: c.recordingUrl || "",
      material: c.materialId,
      materials: c.materials || (c.materialId ? [c.materialId] : []),
      resources: c.resources || [],
      status: isLiveNow ? "live" : isPast ? "ended" : (c.status || "upcoming"),
      isLiveNow,
      isPast,
    };
  });

  return {
    classes: allSessions,
    liveClasses: allSessions,
    allSessions,
  };
}
