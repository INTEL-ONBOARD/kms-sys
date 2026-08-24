import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Course from "@/lib/models/Course";
import Assignment from "@/lib/models/Assignment";
import Submission from "@/lib/models/Submission";
import Enrollment from "@/lib/models/Enrollment";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import { BadRequestError, NotFoundError } from "@/lib/core/errors";
import {
  PaginationParams,
  buildPaginationMeta,
  createSafeSearchRegex,
} from "@/lib/core/pagination";
import {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  GradeSubmissionInput,
  SubmitAssignmentInput,
} from "@/types/dtos/assignment.dto";

// Ensure User is registered
User;

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

  const courses = await Course.find({
    $or: [
      { instructorId: userId },
      ...(userName ? [{ instructor: { $regex: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } }] : []),
    ],
  }).lean();

  const courseIds = courses.map((c) => c._id);

  if (courseIds.length === 0) {
    return {
      assignments: [],
      courses: [],
      pagination: buildPaginationMeta(0, pagination.page, pagination.limit),
    };
  }

  const query: Record<string, any> = {
    courseId: { $in: courseIds },
    category: { $nin: ["Exam", "Final Exam", "Midterm Exam"] },
  };
  if (categoryParam && categoryParam !== "All") {
    query.category = categoryParam;
  }
  if (pagination.search) {
    const searchRegex = createSafeSearchRegex(pagination.search);
    query.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  const total = await Assignment.countDocuments(query);
  const assignmentsDocs = await Assignment.find(query)
    .populate("courseId", "title category assessmentItems gradingBreakdown")
    .sort({ [pagination.sortBy || "createdAt"]: pagination.sortOrder })
    .skip(pagination.skip)
    .limit(pagination.limit)
    .lean();

  // Enrich assignments with their weight from Course assessmentItems and exclude any exam items
  const assignments = assignmentsDocs
    .filter((a: any) => {
      const course = a.courseId;
      if (course?.assessmentItems && Array.isArray(course.assessmentItems)) {
        const match = course.assessmentItems.find(
          (item: any) => item.name?.toLowerCase() === a.title?.toLowerCase()
        );
        if (match && match.type === "exam") return false;
      }
      return true;
    })
    .map((a: any) => {
      const course = a.courseId;
      let weight: number | null = null;
      if (course?.assessmentItems && Array.isArray(course.assessmentItems)) {
        const match = course.assessmentItems.find(
          (item: any) => item.name?.toLowerCase() === a.title?.toLowerCase()
        );
        if (match) weight = match.weight;
      }
      return {
        ...a,
        weight: weight ?? (a.category === "Project" ? 25 : a.category === "Quiz" ? 10 : 20),
      };
    });

  const formattedCourses = courses.map((c: any) => ({
    _id: c._id,
    title: c.title,
    assessmentItems: (c.assessmentItems || []).filter((i: any) => i.type !== "exam" && i.type !== "attendance"),
  }));

  return {
    assignments,
    courses: formattedCourses,
    pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
  };
}

/**
 * Creates a new assignment by a lecturer and notifies enrolled students.
 */
export async function createAssignment(
  userId: string,
  userName: string,
  input: CreateAssignmentInput
) {
  await connectToDatabase();

  const {
    title,
    courseId,
    dueDate,
    maxPoints,
    points,
    description,
    category,
    attachmentUrl,
    attachmentName,
    attachmentSize,
    fileKey,
  } = input;

  if (!title) {
    throw new BadRequestError("Assignment title is required");
  }

  let targetCourseId = courseId;
  if (!targetCourseId) {
    const lecturerCourses = await Course.find({
      $or: [
        { instructorId: userId },
        ...(userName ? [{ instructor: { $regex: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } }] : []),
      ],
    }).lean();

    if (lecturerCourses.length > 0) {
      targetCourseId = lecturerCourses[0]._id.toString();
    }
  }

  if (!targetCourseId) {
    throw new BadRequestError("You do not have any courses assigned to create assignments for. Please contact an administrator.");
  }

  // Fetch course details and check Assessment & Grade Breakdown limits
  const courseDoc = await Course.findById(targetCourseId);
  if (!courseDoc) {
    throw new NotFoundError("Course not found");
  }

  const configuredItems = courseDoc.assessmentItems || [];
  const assignmentBreakdownItems = configuredItems.filter(
    (i: any) => i.type !== "exam" && i.type !== "attendance"
  );
  const maxAllowedAssignments = assignmentBreakdownItems.length;

  if (maxAllowedAssignments === 0) {
    throw new BadRequestError(
      "No assignments are configured in Course Assessment & Grade Breakdown for this course. Please configure the breakdown under Course Management before creating assignments."
    );
  }

  // Validate that the assignment title exists in Course.assessmentItems
  const matchedBreakdownItem = assignmentBreakdownItems.find(
    (i: any) => i.name.trim().toLowerCase() === title.trim().toLowerCase()
  );

  const isExamItem = configuredItems.some(
    (i: any) => i.name.trim().toLowerCase() === title.trim().toLowerCase() && i.type === "exam"
  );

  if (isExamItem) {
    throw new BadRequestError(
      `"${title}" is configured as an Exam in the Course Breakdown. Please create it under Exam Manager.`
    );
  }

  if (!matchedBreakdownItem) {
    throw new BadRequestError(
      `"${title}" is not defined in this Course's Assessment & Grade Breakdown. You can only create assignments that are allocated in the Course Breakdown (${assignmentBreakdownItems.map((i: any) => i.name).join(", ")}).`
    );
  }

  // Quota enforcement
  const existingAssignmentsForCourse = await Assignment.find({
    courseId: targetCourseId,
    category: { $nin: ["Exam", "Final Exam", "Midterm Exam"] },
  }).lean();

  const existingAssignment = existingAssignmentsForCourse.find(
    (a: any) => a.title.trim().toLowerCase() === title.trim().toLowerCase()
  );

  if (!existingAssignment && existingAssignmentsForCourse.length >= maxAllowedAssignments) {
    throw new BadRequestError(
      `Cannot create more than ${maxAllowedAssignments} assignment(s) for this course. The Course Assessment & Grade Breakdown currently allocates ${maxAllowedAssignments} assignment(s). Please update the Course Grade Breakdown if you wish to add more assignments.`
    );
  }

  if (!dueDate) {
    throw new BadRequestError("Assignment due date is required");
  }

  const assignmentDueDate = new Date(dueDate);
  if (isNaN(assignmentDueDate.getTime())) {
    throw new BadRequestError("Invalid due date format");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (assignmentDueDate < startOfToday) {
    throw new BadRequestError("Assignment due date cannot be in the past. Please select a valid future date.");
  }

  let assignment = await Assignment.findOne({
    courseId: targetCourseId,
    title: { $regex: new RegExp(`^${title.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  });

  const itemCategory =
    category ||
    (matchedBreakdownItem.type === "quiz"
      ? "Quiz"
      : matchedBreakdownItem.type === "project"
      ? "Project"
      : matchedBreakdownItem.type === "coursework"
      ? "Lab Report"
      : "Homework");

  const effectiveMaxPoints = Number(maxPoints ?? points) || 100;

  if (assignment) {
    assignment.dueDate = assignmentDueDate;
    assignment.maxPoints = effectiveMaxPoints;
    if (description !== undefined) assignment.description = description;
    assignment.category = itemCategory;
    assignment.attachmentUrl = attachmentUrl || assignment.attachmentUrl || "";
    assignment.attachmentName = attachmentName || assignment.attachmentName || "";
    assignment.attachmentSize = Number(attachmentSize) || assignment.attachmentSize || 0;
    if (fileKey) assignment.fileKey = fileKey;
    assignment.status = "open";
    await assignment.save();
  } else {
    assignment = await Assignment.create({
      title: matchedBreakdownItem.name.trim(),
      description: description || "",
      courseId: targetCourseId,
      dueDate: assignmentDueDate,
      maxPoints: effectiveMaxPoints,
      category: itemCategory,
      attachmentUrl: attachmentUrl || "",
      attachmentName: attachmentName || "",
      attachmentSize: Number(attachmentSize) || 0,
      fileKey: fileKey || "",
      status: "open",
    });
  }

  // Notify enrolled students
  const enrollments = await Enrollment.find({ courseId: targetCourseId }).lean();
  if (enrollments.length > 0) {
    const course = await Course.findById(targetCourseId).lean();
    const courseTitle = course?.title || "Course";
    const notifications = enrollments.map((e) => ({
      userId: e.userId,
      type: "assignment",
      message: `New Assignment: "${title}" in ${courseTitle} (Due: ${assignmentDueDate.toLocaleDateString()})`,
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

  const courses = await Course.find({
    $or: [
      { instructorId: userId },
      ...(userName ? [{ instructor: { $regex: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } }] : []),
    ],
  }).lean();

  const courseIds = courses.map((c) => c._id);

  if (courseIds.length === 0) {
    return { queue: [], pendingQueue: [], gradedQueue: [], stats: { pendingCount: 0, gradedCount: 0, totalSubmissions: 0 } };
  }

  const [pendingSubmissions, gradedSubmissions] = await Promise.all([
    Submission.find({
      courseId: { $in: courseIds },
      grade: null,
    })
      .populate("assignmentId", "title description dueDate maxPoints")
      .populate("studentId", "name email")
      .populate("courseId", "title")
      .sort({ submittedAt: 1 })
      .lean(),
    Submission.find({
      courseId: { $in: courseIds },
      grade: { $ne: null },
    })
      .populate("assignmentId", "title description dueDate maxPoints")
      .populate("studentId", "name email")
      .populate("courseId", "title")
      .sort({ updatedAt: -1, submittedAt: -1 })
      .lean(),
  ]);

  const sortedPendingQueue = pendingSubmissions
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
        assignmentDescription: sub.assignmentId?.description || "",
        maxPoints: sub.assignmentId?.maxPoints || 100,
        courseTitle: sub.courseId?.title || "General Course",
        studentName: sub.studentId?.name || "Student",
        studentEmail: sub.studentId?.email || "",
        dueDate: dueDate.toISOString(),
        isOverdue,
        overdueDays,
        submittedAt: sub.submittedAt,
        content: sub.content || "",
        files: sub.files || [],
        grade: null,
        feedback: "",
        status: sub.status || (isOverdue ? "late" : "submitted"),
      };
    })
    .sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const formattedGraded = gradedSubmissions.map((sub: any) => {
    const dueDate = sub.assignmentId?.dueDate
      ? new Date(sub.assignmentId.dueDate)
      : new Date();
    const isLate = sub.submittedAt && dueDate.getTime() < new Date(sub.submittedAt).getTime();

    return {
      _id: sub._id.toString(),
      assignmentTitle: sub.assignmentId?.title || "Untitled Assignment",
      assignmentDescription: sub.assignmentId?.description || "",
      maxPoints: sub.assignmentId?.maxPoints || 100,
      courseTitle: sub.courseId?.title || "General Course",
      studentName: sub.studentId?.name || "Student",
      studentEmail: sub.studentId?.email || "",
      dueDate: dueDate.toISOString(),
      isOverdue: isLate,
      submittedAt: sub.submittedAt,
      content: sub.content || "",
      files: sub.files || [],
      grade: sub.grade,
      feedback: sub.feedback || "",
      status: "graded",
      gradedAt: sub.updatedAt || sub.submittedAt,
    };
  });

  return {
    queue: sortedPendingQueue,
    pendingQueue: sortedPendingQueue,
    gradedQueue: formattedGraded,
    stats: {
      pendingCount: sortedPendingQueue.length,
      gradedCount: formattedGraded.length,
      totalSubmissions: sortedPendingQueue.length + formattedGraded.length,
    },
  };
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
 * Optionally filters by a specific course (ID, title, or category).
 */
export async function getStudentAssignments(
  userId: string,
  courseFilter?: string,
  searchQuery?: string,
  statusFilter?: string
) {
  await connectToDatabase();

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const currentEnrollments = await Enrollment.find({
    $or: [{ userId: userObjectId }, { userId }],
  }).lean();

  let enrolledCourseIds = currentEnrollments
    .map((e: any) => e.courseId?.toString())
    .filter(Boolean);

  if (enrolledCourseIds.length === 0) {
    const publishedCourses = await Course.find({ published: true }).select("_id").lean();
    enrolledCourseIds = publishedCourses.map((c: any) => c._id.toString());
  }

  let courseObjectIds = enrolledCourseIds.map((id: any) =>
    mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
  );

  // Apply backend course filter if provided
  if (courseFilter && courseFilter !== "All" && courseFilter !== "all") {
    let targetCourseIds: any[] = [];
    if (mongoose.Types.ObjectId.isValid(courseFilter)) {
      targetCourseIds = [new mongoose.Types.ObjectId(courseFilter)];
    } else {
      const escaped = courseFilter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matched = await Course.find({
        $or: [
          { title: { $regex: new RegExp(`^${escaped}$`, "i") } },
          { category: { $regex: new RegExp(`^${escaped}$`, "i") } },
          { code: { $regex: new RegExp(`^${escaped}$`, "i") } },
        ],
      }).select("_id").lean();
      targetCourseIds = matched.map((m: any) => m._id);
    }

    if (targetCourseIds.length > 0) {
      courseObjectIds = courseObjectIds.filter((cid: any) =>
        targetCourseIds.some((tid) => tid.toString() === cid.toString())
      );
      // Fallback: if student is enrolled or exploring, use the targeted course ids
      if (courseObjectIds.length === 0) {
        courseObjectIds = targetCourseIds;
      }
    }
  }

  // Construct MongoDB assignment query
  const assignmentQuery: any = {
    courseId: { $in: courseObjectIds },
    category: { $nin: ["Exam", "Final Exam", "Midterm Exam"] },
  };

  // Backend search filter across title, category, description, and course title
  if (searchQuery && searchQuery.trim()) {
    const escapedSearch = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");

    const matchingCourses = await Course.find({
      $or: [
        { title: { $regex: searchRegex } },
        { category: { $regex: searchRegex } },
        { code: { $regex: searchRegex } },
        { instructor: { $regex: searchRegex } },
      ],
    }).select("_id").lean();
    const matchingCourseIds = matchingCourses.map((c: any) => c._id);

    assignmentQuery.$or = [
      { title: { $regex: searchRegex } },
      { category: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
      { courseId: { $in: matchingCourseIds } },
    ];
  }

  const assignments = await Assignment.find(assignmentQuery)
    .populate({
      path: "courseId",
      select: "title category instructor assessmentItems",
      model: Course,
    })
    .sort({ dueDate: 1 })
    .lean();

  const validAssignments = assignments.filter((a: any) => {
    const course = a.courseId;
    if (course?.assessmentItems && Array.isArray(course.assessmentItems)) {
      const match = course.assessmentItems.find(
        (item: any) => item.name?.toLowerCase() === a.title?.toLowerCase()
      );
      if (match && match.type === "exam") return false;
    }
    return true;
  });

  const assignmentIds = validAssignments.map((a) => a._id);

  const submissions = await Submission.find({
    studentId: { $in: [userObjectId, userId] },
    assignmentId: { $in: assignmentIds },
  }).lean();

  const submissionMap = new Map();
  submissions.forEach((s: any) => {
    submissionMap.set(s.assignmentId.toString(), s);
  });

  const now = new Date();

  const formattedAssignments = validAssignments.map((a: any) => {
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

    let weight = 20;
    if (a.courseId?.assessmentItems && Array.isArray(a.courseId.assessmentItems)) {
      const match = a.courseId.assessmentItems.find(
        (item: any) => item.name?.toLowerCase() === a.title?.toLowerCase()
      );
      if (match && typeof match.weight === "number") weight = match.weight;
    }

    return {
      _id: a._id.toString(),
      title: a.title || "Untitled Assignment",
      description: a.description || "",
      course: a.courseId?.title || "General Course",
      courseId: a.courseId?._id?.toString() || "",
      courseCategory: a.courseId?.category || "General",
      instructor: a.courseId?.instructor || "Module Lecturer",
      attachmentUrl: a.attachmentUrl || "",
      attachmentName: a.attachmentName || "",
      attachmentSize: a.attachmentSize || 0,
      weight,
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

  let finalAssignments = formattedAssignments;
  if (statusFilter && statusFilter !== "All" && statusFilter !== "all") {
    finalAssignments = formattedAssignments.filter((a: any) => {
      if (statusFilter === "Pending") return a.status === "Pending" || a.status === "Overdue";
      return a.status.toLowerCase() === statusFilter.toLowerCase();
    });
  }

  return {
    assignments: finalAssignments,
    total: finalAssignments.length,
  };
}

/**
 * Creates or updates a student submission for an assignment.
 */
export async function submitAssignment(
  userId: string,
  input: SubmitAssignmentInput
) {
  await connectToDatabase();

  const assignment = await Assignment.findById(input.assignmentId);
  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }

  const now = new Date();
  const isLate = assignment.dueDate && new Date(assignment.dueDate).getTime() < now.getTime();

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;

  const existingSubmission = await Submission.findOne({
    assignmentId: input.assignmentId,
    studentId: { $in: [userObjectId, userId] },
  });

  let submission;
  if (existingSubmission) {
    existingSubmission.content = input.content || input.comments || existingSubmission.content;
    if (input.files && input.files.length > 0) existingSubmission.files = input.files;
    existingSubmission.submittedAt = now;
    existingSubmission.status = isLate ? "late" : "submitted";
    submission = await existingSubmission.save();
  } else {
    submission = await Submission.create({
      assignmentId: input.assignmentId,
      studentId: userObjectId,
      courseId: input.courseId || assignment.courseId,
      content: input.content || input.comments || "",
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
