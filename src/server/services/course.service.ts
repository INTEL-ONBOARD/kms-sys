import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Course, { CourseDoc } from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Assignment from "@/models/Assignment";
import { NotFoundError } from "../core/errors";
import {
  PaginationParams,
  buildPaginationMeta,
  createSafeSearchRegex,
} from "../core/pagination";
import { CreateCourseInput, UpdateCourseInput } from "../dtos/course.dto";

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
      (s) => s.dayOfWeek && s.startTime && s.endTime
    ),
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
  if (input.schedule !== undefined) {
    updatePayload.schedule = input.schedule.filter(
      (s) => s.dayOfWeek && s.startTime && s.endTime
    );
  }

  const updatedCourse = await Course.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updatedCourse) {
    throw new NotFoundError("Course not found to update");
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
 */
export async function getLecturerCourses(
  lecturerId: string,
  lecturerName: string,
  pagination: PaginationParams
) {
  await connectToDatabase();

  const safeNameRegex = createSafeSearchRegex(lecturerName);
  const query: Record<string, any> = {
    $or: [
      { instructorId: lecturerId },
      { instructor: { $regex: safeNameRegex } },
    ],
  };

  let total = await Course.countDocuments(query);
  let courses = await Course.find(query)
    .skip(pagination.skip)
    .limit(pagination.limit)
    .lean();

  // If no courses found for this lecturer specifically, fallback to all courses
  if (total === 0) {
    total = await Course.countDocuments();
    courses = await Course.find()
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();
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
