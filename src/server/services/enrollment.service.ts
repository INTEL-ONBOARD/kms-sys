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

  const now = new Date();

  // 2. Upcoming assignments for enrolled courses
  const assignments =
    courseIds.length > 0
      ? await Assignment.find({
          courseId: { $in: courseIds },
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
    courseIds.length > 0
      ? await Exam.find({
          courseId: { $in: courseIds },
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
    courseIds.length > 0
      ? await LiveClass.find({
          courseId: { $in: courseIds },
          endTime: { $gte: now },
          status: { $in: ["upcoming", "live"] },
        })
          .populate("courseId", "title")
          .sort({ startTime: 1 })
          .limit(10)
          .lean()
      : [];

  // 5. Recent course materials
  const materials =
    courseIds.length > 0
      ? await CourseMaterial.find({
          courseId: { $in: courseIds },
          isPublished: true,
        })
          .populate("courseId", "title")
          .sort({ createdAt: -1 })
          .limit(6)
          .lean()
      : [];

  // 6. Calculate dynamic Credits, Attendance, and GPA
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

  return {
    enrollments: validEnrollments,
    assignments,
    exams,
    liveClasses,
    materials,
    credits,
    gpa,
    attendance,
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
 * Retrieves calendar schedule for enrolled student courses.
 */
export async function getStudentCalendar(userId: string) {
  await connectToDatabase();

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const enrollments = await Enrollment.find({
    $or: [{ userId: userObjectId }, { userId }],
  })
    .populate("courseId", "title instructor category schedule colorCode")
    .lean();

  const validCourses = enrollments
    .map((e: any) => e.courseId)
    .filter(Boolean);

  return { courses: validCourses };
}

/**
 * Retrieves live classes and recordings for enrolled courses.
 */
export async function getStudentLiveClasses(userId: string) {
  await connectToDatabase();

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const enrollments = await Enrollment.find({
    $or: [{ userId: userObjectId }, { userId }],
  }).lean();

  const courseIds = enrollments.map((e) => e.courseId);

  const classes = await LiveClass.find({
    courseId: { $in: courseIds },
  })
    .populate("courseId", "title instructor")
    .sort({ startTime: -1 })
    .lean();

  return { classes, liveClasses: classes };
}
