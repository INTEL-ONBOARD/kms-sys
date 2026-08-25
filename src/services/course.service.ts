import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Course, { CourseDoc } from "@/lib/models/Course";
import Enrollment from "@/lib/models/Enrollment";
import Assignment from "@/lib/models/Assignment";
import Notification from "@/lib/models/Notification";
import Exam from "@/lib/models/Exam";
import { resolveGradeFromScale } from "@/lib/grading";
import { NotFoundError } from "@/lib/core/errors";
import {
  PaginationParams,
  buildPaginationMeta,
  createSafeSearchRegex,
} from "@/lib/core/pagination";
import { CreateCourseInput, UpdateCourseInput } from "@/types/dtos/course.dto";

/**
 * Retrieves all courses with optional pagination, search, and category filter.
 */
export async function getCourses(
  pagination?: PaginationParams,
  filters?: { category?: string; published?: boolean; status?: string }
) {
  await connectToDatabase();

  const query: Record<string, any> = {};

  if (filters?.category && filters.category !== "All") {
    query.category = filters.category;
  }
  if (filters?.published !== undefined) {
    query.published = filters.published;
  }
  if (filters?.status) {
    query.status = filters.status;
  }
  if (pagination?.search) {
    const searchRegex = createSafeSearchRegex(pagination.search);
    query.$or = [
      { title: searchRegex },
      { instructor: searchRegex },
      { category: searchRegex },
      { description: searchRegex },
    ];
  }

  if (pagination) {
    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .sort({ [pagination.sortBy || "createdAt"]: pagination.sortOrder })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      courses,
      pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  const courses = await Course.find(query).sort({ createdAt: -1 }).lean();
  return { courses };
}

/**
 * Retrieves a single course by ID.
 */
export async function getCourseById(id: string) {
  await connectToDatabase();
  const course = await Course.findById(id).lean();
  if (!course) {
    throw new NotFoundError("Course not found");
  }
  return course;
}

/**
 * Creates a new course.
 */
export async function createCourse(input: CreateCourseInput, creatorId?: string) {
  await connectToDatabase();

  const newCourse = await Course.create({
    title: input.title.trim(),
    description: input.description?.trim() || "",
    instructor: input.instructor.trim(),
    instructorId: input.instructorId || creatorId,
    category: input.category?.trim() || "Design",
    price: input.price?.trim() || "Free",
    status: input.status || "draft",
    published: input.published ?? false,
    colorCode: input.colorCode?.trim() || "#5A67D8",
    schedule: (input.schedule || []).filter(
      (s: any) => s.dayOfWeek && s.startTime && s.endTime
    ),
    assessmentItems: input.assessmentItems,
    gradingBreakdown: input.gradingBreakdown,
    credits: typeof input.credits === "number" ? input.credits : 3,
    enrollments: 0,
  });

  return newCourse;
}

/**
 * Updates an existing course by ID.
 */
export async function updateCourse(id: string, input: UpdateCourseInput) {
  await connectToDatabase();

  const updatePayload: Record<string, any> = {};
  if (input.title !== undefined) updatePayload.title = input.title.trim();
  if (input.description !== undefined) updatePayload.description = input.description.trim();
  if (input.instructor !== undefined) updatePayload.instructor = input.instructor.trim();
  if (input.instructorId !== undefined) updatePayload.instructorId = input.instructorId;
  if (input.category !== undefined) updatePayload.category = input.category.trim();
  if (input.price !== undefined) updatePayload.price = input.price.trim();
  if (input.status !== undefined) updatePayload.status = input.status;
  if (input.published !== undefined) updatePayload.published = input.published;
  if (input.colorCode !== undefined) updatePayload.colorCode = input.colorCode.trim();
  if (input.credits !== undefined) updatePayload.credits = Math.max(1, Math.min(30, Number(input.credits) || 3));
  if (input.schedule !== undefined) {
    updatePayload.schedule = input.schedule.filter(
      (s: any) => s.dayOfWeek && s.startTime && s.endTime
    );
  }

  if (input.assessmentItems !== undefined && Array.isArray(input.assessmentItems)) {
    updatePayload.assessmentItems = input.assessmentItems.map((item: any) => ({
      name: String(item.name || "Assessment Item").trim(),
      type: item.type || "assignment",
      weight: Math.max(0, Number(item.weight) || 0),
    }));

    // Automatically keep gradingBreakdown in sync
    const assignSum = updatePayload.assessmentItems.filter((i: any) => i.type === "assignment").reduce((s: number, i: any) => s + i.weight, 0);
    const cwSum = updatePayload.assessmentItems.filter((i: any) => i.type === "coursework" || i.type === "quiz" || i.type === "project").reduce((s: number, i: any) => s + i.weight, 0);
    const examSum = updatePayload.assessmentItems.filter((i: any) => i.type === "exam").reduce((s: number, i: any) => s + i.weight, 0);
    const attSum = updatePayload.assessmentItems.filter((i: any) => i.type === "attendance").reduce((s: number, i: any) => s + i.weight, 0);
    updatePayload.gradingBreakdown = {
      assignmentsWeight: assignSum,
      courseWorkWeight: cwSum,
      finalExamWeight: examSum,
      attendanceWeight: attSum,
    };
  } else if (input.gradingBreakdown !== undefined) {
    updatePayload.gradingBreakdown = {
      assignmentsWeight: typeof input.gradingBreakdown.assignmentsWeight === "number" ? input.gradingBreakdown.assignmentsWeight : 20,
      courseWorkWeight: typeof input.gradingBreakdown.courseWorkWeight === "number" ? input.gradingBreakdown.courseWorkWeight : 30,
      finalExamWeight: typeof input.gradingBreakdown.finalExamWeight === "number" ? input.gradingBreakdown.finalExamWeight : 40,
      attendanceWeight: typeof input.gradingBreakdown.attendanceWeight === "number" ? input.gradingBreakdown.attendanceWeight : 10,
    };
  }

  if (input.gradingScale !== undefined && Array.isArray(input.gradingScale)) {
    updatePayload.gradingScale = input.gradingScale.map((b: any) => ({
      grade: String(b.grade || "").trim().toUpperCase(),
      minScore: Math.max(0, Math.min(100, Number(b.minScore) || 0)),
      gpaPoint: Math.max(0, Math.min(4.0, Number(b.gpaPoint) || 0)),
      description: String(b.description || "").trim(),
      color: String(b.color || "emerald").trim(),
    }));
  }

  const updatedCourse = await Course.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updatedCourse) {
    throw new NotFoundError("Course not found to update");
  }

  // If weekly schedule was updated / rescheduled, notify enrolled students
  if (input.schedule !== undefined) {
    try {
      const enrollments = await Enrollment.find({ courseId: id }).lean();
      if (enrollments.length > 0) {
        const notifications = enrollments.map((e) => ({
          userId: e.userId,
          type: "class",
          message: `Timetable Updated: Weekly class schedule for "${updatedCourse.title}" has been updated.`,
          link: "/calendar",
        }));
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.warn("Could not dispatch schedule update notifications:", notifErr);
    }
  }

  // If grading scale was updated, recalculate all existing exam results & notify enrolled students
  if (input.gradingScale !== undefined) {
    try {
      // 1. Recalculate student letter grades on all existing exams for this course
      const exams = await Exam.find({ courseId: id });
      for (const exam of exams) {
        if (exam.results && exam.results.length > 0) {
          let hasChanges = false;
          for (const r of exam.results as any[]) {
            const effectiveMax = Number(r.maxMarks || exam.maxMarks) || 100;
            const marksNum = Number(r.marks) || 0;
            const pct = effectiveMax > 0 ? Math.round((marksNum / effectiveMax) * 100) : 0;
            const resolved = resolveGradeFromScale(pct, updatedCourse.gradingScale);
            if (r.grade !== resolved.grade || r.percentage !== pct) {
              hasChanges = true;
              r.percentage = pct;
              r.grade = resolved.grade;
              r.maxMarks = effectiveMax;
            }
          }

          if (hasChanges) {
            exam.markModified("results");
            await exam.save();
          }
        }
      }
    } catch (examSyncErr) {
      console.warn("Could not sync exam results with new grading scale:", examSyncErr);
    }

    try {
      const enrollments = await Enrollment.find({ courseId: id }).lean();
      if (enrollments.length > 0) {
        const notifications = enrollments.map((e) => ({
          userId: e.userId,
          type: "announcement",
          message: `Grading Scale Updated: The grading scale and score thresholds for "${updatedCourse.title}" have been updated by your lecturer.`,
          link: "/grades",
        }));
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.warn("Could not dispatch grading scale update notifications:", notifErr);
    }
  }

  return updatedCourse;
}

/**
 * Deletes a course by ID.
 */
export async function deleteCourse(id: string) {
  await connectToDatabase();
  const deleted = await Course.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError("Course not found to delete");
  }
  return { id };
}

/**
 * Retrieves courses assigned to or managed by a lecturer, with student counts, average completion, and assignment statistics.
 * If a lecturer has no courses assigned yet from admin panel, returns an empty array.
 */
export async function getLecturerCourses(
  lecturerId: string,
  lecturerName: string,
  pagination: PaginationParams
) {
  await connectToDatabase();

  const query: Record<string, any> = {
    $or: [
      { instructorId: lecturerId },
      ...(lecturerName ? [{ instructor: { $regex: new RegExp(`^${lecturerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } }] : []),
    ],
  };

  if (pagination?.search) {
    const searchRegex = createSafeSearchRegex(pagination.search);
    query.$and = [
      {
        $or: [
          { title: searchRegex },
          { category: searchRegex },
          { description: searchRegex },
          { instructor: searchRegex },
        ],
      },
    ];
  }

  const total = await Course.countDocuments(query);
  const courses = await Course.find(query)
    .sort({ [pagination.sortBy || "createdAt"]: pagination.sortOrder })
    .skip(pagination.skip)
    .limit(pagination.limit)
    .lean();

  if (courses.length === 0) {
    return {
      data: [],
      courses: [],
      pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  const courseIds = courses.map((c) => c._id);

  const [enrollmentStats, assignments] = await Promise.all([
    Enrollment.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      {
        $group: {
          _id: "$courseId",
          count: { $sum: 1 },
          avgProgress: { $avg: "$progress" },
        },
      },
    ]),
    Assignment.find({ courseId: { $in: courseIds } }).lean(),
  ]);

  const statsMap = new Map();
  enrollmentStats.forEach((e: any) => {
    statsMap.set(e._id.toString(), {
      count: e.count,
      avgProgress: Math.round(e.avgProgress || 0),
    });
  });

  const data = courses.map((course: any) => {
    const stats = statsMap.get(course._id.toString()) || { count: 0, avgProgress: 0 };
    const courseAssignments = assignments.filter(
      (a: any) => a.courseId.toString() === course._id.toString()
    ).length;

    return {
      ...course,
      _id: course._id.toString(),
      assessmentItems: course.assessmentItems && course.assessmentItems.length > 0
        ? course.assessmentItems
        : [
            { name: "Assignments", type: "assignment", weight: course.gradingBreakdown?.assignmentsWeight ?? 20 },
            { name: "Course work 1", type: "coursework", weight: course.gradingBreakdown?.courseWorkWeight ?? 30 },
            { name: "Final exam", type: "exam", weight: course.gradingBreakdown?.finalExamWeight ?? 40 },
            { name: "Attendance", type: "attendance", weight: course.gradingBreakdown?.attendanceWeight ?? 10 },
          ],
      gradingBreakdown: course.gradingBreakdown || {
        assignmentsWeight: 20,
        courseWorkWeight: 30,
        finalExamWeight: 40,
        attendanceWeight: 10,
      },
      studentCount: stats.count,
      avgCompletion: stats.avgProgress,
      assignmentCount: courseAssignments,
    };
  });

  return {
    data,
    courses: data,
    pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
  };
}
