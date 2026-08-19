import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import Assignment from "@/models/Assignment";
import Submission from "@/models/Submission";
import Enrollment from "@/models/Enrollment";
import Notification from "@/models/Notification";
import { BadRequestError, NotFoundError } from "../core/errors";
import {
  PaginationParams,
  buildPaginationMeta,
  createSafeSearchRegex,
} from "../core/pagination";
import {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  GradeSubmissionInput,
} from "../dtos/assignment.dto";

/**
 * Retrieves assignments for a lecturer with pagination and optional course/category filter.
 */
export async function getLecturerAssignments(
  userId: string,
  userName: string,
  pagination: PaginationParams,
  categoryParam?: string
) {
  await connectToDatabase();

  const nameRegex = createSafeSearchRegex(userName);
  const courses = await Course.find({
    $or: [{ instructorId: userId }, { instructor: { $regex: nameRegex } }],
  }).lean();

  const courseIds = courses.map((c) => c._id);

  const query: Record<string, any> = { courseId: { $in: courseIds } };
  if (categoryParam && categoryParam !== "All") {
    query.category = categoryParam;
  }
  if (pagination.search) {
    const searchRegex = createSafeSearchRegex(pagination.search);
    query.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  const total = await Assignment.countDocuments(query);
  const assignments = await Assignment.find(query)
    .populate("courseId", "title category")
    .sort({ [pagination.sortBy || "createdAt"]: pagination.sortOrder })
    .skip(pagination.skip)
    .limit(pagination.limit)
    .lean();

  return {
    assignments,
    pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
  };
}

/**
 * Creates a new assignment by a lecturer and notifies enrolled students.
 */
export async function createAssignment(
  userId: string,
  userName: string,
  input: CreateAssignmentInput & { maxPoints?: number; category?: string }
) {
  await connectToDatabase();

  let targetCourseId = input.courseId;
  if (!targetCourseId) {
    const nameRegex = createSafeSearchRegex(userName);
    const lecturerCourses = await Course.find({
      $or: [{ instructorId: userId }, { instructor: { $regex: nameRegex } }],
    }).lean();

    if (lecturerCourses.length > 0) {
      targetCourseId = lecturerCourses[0]._id.toString();
    } else {
      const anyCourse = await Course.findOne().lean();
      if (anyCourse) {
        targetCourseId = anyCourse._id.toString();
      } else {
        const defaultCourse = await Course.create({
          title: "General Lecture Course",
          instructor: userName || "Lecturer",
          instructorId: userId,
          category: "General",
          price: "Free",
          published: true,
        });
        targetCourseId = defaultCourse._id.toString();
      }
    }
  }

  const dueDate = input.dueDate
    ? new Date(input.dueDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const assignment = await Assignment.create({
    title: input.title.trim(),
    description: input.description?.trim() || "",
    courseId: targetCourseId,
    dueDate,
    maxPoints: input.maxPoints ?? input.points ?? 100,
    category: input.category || "Homework",
    status: input.status || "open",
  });

  // Notify enrolled students
  const enrollments = await Enrollment.find({ courseId: targetCourseId }).lean();
  if (enrollments.length > 0) {
    const course = await Course.findById(targetCourseId).lean();
    const courseTitle = course?.title || "Course";
    const notifications = enrollments.map((e) => ({
      userId: e.userId,
      type: "assignment",
      message: `New Assignment: "${input.title}" in ${courseTitle} (Due: ${dueDate.toLocaleDateString()})`,
      link: "/assignments",
    }));
    await Notification.insertMany(notifications);
  }

  return assignment;
}

/**
 * Retrieves the pending grading queue for a lecturer.
 */
export async function getGradingQueue(userId: string, userName: string) {
  await connectToDatabase();

  const nameRegex = createSafeSearchRegex(userName);
  const courses = await Course.find({
    $or: [{ instructorId: userId }, { instructor: { $regex: nameRegex } }],
  }).lean();

  const courseIds = courses.map((c) => c._id);

  const pendingSubmissions = await Submission.find({
    courseId: { $in: courseIds },
    grade: null,
  })
    .populate("assignmentId", "title dueDate maxPoints")
    .populate("studentId", "name email")
    .populate("courseId", "title")
    .sort({ submittedAt: 1 })
    .lean();

  const sortedQueue = pendingSubmissions
    .map((sub: any) => {
      const dueDate = sub.assignmentId?.dueDate
        ? new Date(sub.assignmentId.dueDate)
        : new Date();
      const isOverdue = dueDate.getTime() < Date.now();
      const overdueDays = isOverdue
        ? Math.max(1, Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        _id: sub._id.toString(),
        assignmentTitle: sub.assignmentId?.title || "Untitled Assignment",
        courseTitle: sub.courseId?.title || "General Course",
        studentName: sub.studentId?.name || "Student",
        studentEmail: sub.studentId?.email || "",
        dueDate: dueDate.toISOString(),
        isOverdue,
        overdueDays,
        submittedAt: sub.submittedAt,
        content: sub.content,
        files: sub.files || [],
      };
    })
    .sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  return { queue: sortedQueue };
}

/**
 * Grades a student submission.
 */
export async function gradeSubmission(input: GradeSubmissionInput) {
  await connectToDatabase();

  const existingSub = await Submission.findById(input.submissionId);
  if (!existingSub) {
    throw new NotFoundError("Submission not found");
  }

  const wasUngraded = existingSub.grade === null || existingSub.grade === undefined;

  existingSub.grade = input.grade;
  existingSub.feedback = input.feedback || "";
  existingSub.status = "graded";
  await existingSub.save();

  if (wasUngraded) {
    await Assignment.findByIdAndUpdate(existingSub.assignmentId, {
      $inc: { gradedCount: 1 },
    });
  }

  // Create notification for student
  const assignmentDoc = await Assignment.findById(existingSub.assignmentId).lean();
  const assignmentTitle = assignmentDoc?.title || "Assignment";
  await Notification.create({
    userId: existingSub.studentId,
    type: "grading",
    message: `Results Published: "${assignmentTitle}" graded (${existingSub.grade} pts)`,
    link: `/assignments`,
  });

  return existingSub;
}

/**
 * Retrieves assignments and student submission status for enrolled student courses.
 */
export async function getStudentAssignments(userId: string) {
  await connectToDatabase();

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const currentEnrollments = await Enrollment.find({
    $or: [{ userId: userObjectId }, { userId }],
  }).lean();

  const courseIds = currentEnrollments
    .map((e: any) => e.courseId?.toString())
    .filter(Boolean);

  const assignments = await Assignment.find({ courseId: { $in: courseIds } })
    .populate({
      path: "courseId",
      select: "title category instructor",
      model: Course,
    })
    .sort({ dueDate: 1 })
    .lean();

  const assignmentIds = assignments.map((a) => a._id);

  const submissions = await Submission.find({
    studentId: userId,
    assignmentId: { $in: assignmentIds },
  }).lean();

  const submissionMap = new Map();
  submissions.forEach((s: any) => {
    submissionMap.set(s.assignmentId.toString(), s);
  });

  const now = new Date();

  const formattedAssignments = assignments.map((a: any) => {
    const sub = submissionMap.get(a._id.toString());
    const due = a.dueDate ? new Date(a.dueDate) : new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isOverdue = diffMs < 0;

    let state = "Pending";
    if (sub) {
      if (sub.grade !== null && sub.grade !== undefined) {
        state = "Graded";
      } else {
        state = "Submitted";
      }
    } else if (isOverdue) {
      state = "Overdue";
    }

    let timeLeft = "";
    if (isOverdue) {
      const absDays = Math.abs(diffDays);
      timeLeft = absDays === 0 ? "Overdue today" : `Overdue by ${absDays} day${absDays > 1 ? "s" : ""}`;
    } else if (diffDays === 0) {
      timeLeft = "Due Today";
    } else if (diffDays === 1) {
      timeLeft = "1 Day Left";
    } else if (diffDays < 7) {
      timeLeft = `${diffDays} Days Left`;
    } else {
      const weeks = Math.ceil(diffDays / 7);
      timeLeft = `${weeks} Week${weeks > 1 ? "s" : ""} Left`;
    }

    const isUrgent = !sub && diffDays <= 3 && diffDays >= 0;

    return {
      _id: a._id.toString(),
      title: a.title || "Untitled Assignment",
      description: a.description || "",
      course: a.courseId?.title || "General Course",
      courseId: a.courseId?._id?.toString() || "",
      courseCategory: a.courseId?.category || "General",
      instructor: a.courseId?.instructor || "Module Lecturer",
      issuedDate: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
      issuedDateFormatted: a.createdAt
        ? new Date(a.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "Recently Issued",
      dueDate: due.toISOString(),
      dueDateFormatted: due.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      maxPoints: a.maxPoints || 100,
      category: a.category || "Homework",
      isOverdue,
      isUrgent,
      timeLeft,
      status: state,
      submission: sub
        ? {
            _id: sub._id.toString(),
            content: sub.content || "",
            files: sub.files || [],
            submittedAt: sub.submittedAt,
            grade: sub.grade,
            feedback: sub.feedback || "",
            status: sub.status || "submitted",
          }
        : null,
    };
  });

  return {
    assignments: formattedAssignments,
    total: formattedAssignments.length,
  };
}

/**
 * Creates or updates a student submission for an assignment.
 */
export async function submitAssignment(
  userId: string,
  input: { assignmentId: string; courseId?: string; content?: string; files?: any[] }
) {
  await connectToDatabase();

  const assignment = await Assignment.findById(input.assignmentId);
  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }

  const now = new Date();
  const isLate = assignment.dueDate && new Date(assignment.dueDate).getTime() < now.getTime();

  const existingSubmission = await Submission.findOne({
    assignmentId: input.assignmentId,
    studentId: userId,
  });

  let submission;
  if (existingSubmission) {
    existingSubmission.content = input.content || existingSubmission.content;
    if (input.files && input.files.length > 0) existingSubmission.files = input.files;
    existingSubmission.submittedAt = now;
    existingSubmission.status = isLate ? "late" : "submitted";
    submission = await existingSubmission.save();
  } else {
    submission = await Submission.create({
      assignmentId: input.assignmentId,
      studentId: userId,
      courseId: input.courseId || assignment.courseId,
      content: input.content || "",
      files: input.files || [],
      submittedAt: now,
      status: isLate ? "late" : "submitted",
    });

    await Assignment.findByIdAndUpdate(input.assignmentId, {
      $inc: { submissionsCount: 1 },
    });
  }

  return {
    submission,
    isLate,
    message: isLate ? "Late assignment submitted successfully" : "Assignment submitted successfully!",
  };
}
