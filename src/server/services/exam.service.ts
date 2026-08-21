import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Exam, { ExamDoc } from "@/models/Exam";
import Course, { AssessmentItem } from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Notification from "@/models/Notification";
import { BadRequestError, NotFoundError } from "../core/errors";
import {
  PaginationParams,
  buildPaginationMeta,
  createSafeSearchRegex,
} from "../core/pagination";

interface PopulatedExamDoc extends Omit<ExamDoc, "courseId"> {
  courseId: {
    _id: mongoose.Types.ObjectId;
    title?: string;
    category?: string;
    assessmentItems?: AssessmentItem[];
  } | null;
}

/**
 * Retrieves exams for lecturer's courses.
 */
export async function getLecturerExams(
  userId: string,
  userName: string,
  pagination: PaginationParams
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
      exams: [],
      courses: [],
      pagination: buildPaginationMeta(0, pagination.page, pagination.limit),
    };
  }

  const query: Record<string, unknown> = { courseId: { $in: courseIds } };
  if (pagination.search) {
    const searchRegex = createSafeSearchRegex(pagination.search);
    query.title = searchRegex;
  }

  const total = await Exam.countDocuments(query);
  const examsDocs = (await Exam.find(query)
    .populate("courseId", "title category assessmentItems")
    .sort({ [pagination.sortBy || "date"]: pagination.sortOrder })
    .skip(pagination.skip)
    .limit(pagination.limit)
    .lean()) as unknown as PopulatedExamDoc[];

  // Enrich exams with weight from course breakdown
  const exams = examsDocs.map((e) => {
    const course = e.courseId;
    let weight: number | null = null;
    if (course?.assessmentItems && Array.isArray(course.assessmentItems)) {
      const match = course.assessmentItems.find(
        (item) => item.name?.toLowerCase() === e.title?.toLowerCase()
      );
      if (match) weight = match.weight;
    }
    return {
      ...e,
      weight: weight ?? (e.type === "final" ? 40 : e.type === "midterm" ? 25 : 15),
    };
  });

  const formattedCourses = courses.map((c) => ({
    _id: c._id,
    title: c.title,
    assessmentItems: (c.assessmentItems || []).filter((i: AssessmentItem) => i.type === "exam"),
  }));

  return {
    exams,
    courses: formattedCourses,
    pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
  };
}

/**
 * Creates a new exam and notifies enrolled students.
 */
export async function createExam(
  userId: string,
  userName: string,
  input: {
    title: string;
    courseId?: string;
    date?: string | Date;
    duration?: number;
    location?: string;
    type?: string;
  }
) {
  await connectToDatabase();

  const { title, courseId, date, duration, location, type } = input;

  if (!title) {
    throw new BadRequestError("Exam title is required");
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
    throw new BadRequestError("You do not have any courses assigned to schedule exams for. Please contact an administrator.");
  }

  // Validate that the exam title is an exam component in Course.assessmentItems
  const courseDoc = await Course.findById(targetCourseId);
  if (courseDoc && courseDoc.assessmentItems && courseDoc.assessmentItems.length > 0) {
    const isConfiguredExam = courseDoc.assessmentItems.some(
      (i: AssessmentItem) => i.name.trim().toLowerCase() === title.trim().toLowerCase() && i.type === "exam"
    );
    if (!isConfiguredExam) {
      const isAssignment = courseDoc.assessmentItems.some(
        (i: AssessmentItem) => i.name.trim().toLowerCase() === title.trim().toLowerCase() && i.type !== "exam"
      );
      if (isAssignment) {
        throw new BadRequestError(
          `"${title}" is configured as Coursework/Assignment in the Grade Breakdown. Please create it under Assignment Manager.`
        );
      }
    }
  }

  if (!date) {
    throw new BadRequestError("Exam date and start time are required");
  }

  const examDate = new Date(date);
  if (isNaN(examDate.getTime())) {
    throw new BadRequestError("Invalid date format");
  }

  // Allow 5 minutes clock skew buffer for network / form submission
  if (examDate.getTime() < Date.now() - 5 * 60 * 1000) {
    throw new BadRequestError("Exam date and start time cannot be in the past. Please select a valid future schedule.");
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
    const durMins = Number(duration) || 120;
    const endExamDate = new Date(examDate.getTime() + durMins * 60 * 1000);
    const dateFormatted = examDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const startTimeFormatted = examDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const endTimeFormatted = endExamDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const notifications = enrollments.map((e) => ({
      userId: e.userId,
      type: "exam",
      message: `New Exam Scheduled: "${title}" in ${courseTitle} on ${dateFormatted} (${startTimeFormatted} – ${endTimeFormatted})`,
      link: "/calendar",
    }));
    await Notification.insertMany(notifications);
  }

  return exam;
}

/**
 * Updates an exam or publishes its results.
 */
export async function updateExam(
  examId: string,
  input: {
    title?: string;
    date?: string | Date;
    duration?: number;
    location?: string;
    type?: string;
    status?: string;
    publishResults?: boolean;
  }
) {
  await connectToDatabase();

  const updateFields: mongoose.UpdateQuery<ExamDoc> = {};
  if (input.title) updateFields.title = input.title.trim();
  if (input.date) {
    const updatedDate = new Date(input.date);
    if (isNaN(updatedDate.getTime())) {
      throw new BadRequestError("Invalid date format");
    }
    updateFields.date = updatedDate;
  }
  if (input.duration) updateFields.duration = Number(input.duration);
  if (input.location) updateFields.location = input.location.trim();
  if (input.type) updateFields.type = input.type;
  if (input.status) updateFields.status = input.status;

  if (input.publishResults) {
    updateFields.status = "completed";
  }

  const updatedExam = await Exam.findByIdAndUpdate(examId, updateFields, {
    new: true,
  }).populate("courseId", "title");

  if (!updatedExam) {
    throw new NotFoundError("Exam not found");
  }

  if (input.publishResults) {
    const enrollments = await Enrollment.find({
      courseId: updatedExam.courseId,
    }).lean();
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

  return updatedExam;
}

/**
 * Retrieves the exam details along with all enrolled students and their current marks.
 */
export async function getExamGradingRoster(
  examId: string,
  userId: string,
  userName: string
) {
  await connectToDatabase();

  const exam = await Exam.findById(examId)
    .populate("courseId", "title category instructor instructorId assessmentItems code")
    .lean();

  if (!exam) {
    throw new NotFoundError("Exam not found");
  }

  const course = exam.courseId as any;
  const courseId = course?._id;

  let weight = 40;
  let attendanceItem: any = null;

  if (course?.assessmentItems && Array.isArray(course.assessmentItems)) {
    const match = course.assessmentItems.find(
      (item: any) => item.name?.toLowerCase() === exam.title?.toLowerCase()
    );
    if (match && typeof match.weight === "number") {
      weight = match.weight;
    }
    attendanceItem = course.assessmentItems.find(
      (item: any) => item.type === "attendance"
    );
  }

  const enrollments = await Enrollment.find({ courseId })
    .populate("userId", "name email image")
    .sort({ createdAt: 1 })
    .lean();

  const students = enrollments.map((enr: any) => {
    const u = enr.userId;
    const studentIdStr = u?._id ? u._id.toString() : enr.userId?.toString() || "";
    const existingResult = (exam as any).results?.find(
      (r: any) => r.studentId?.toString() === studentIdStr
    );

    return {
      studentId: studentIdStr,
      name: u?.name || "Student",
      email: u?.email || "",
      image: u?.image || "",
      marks:
        existingResult && existingResult.marks !== undefined && existingResult.marks !== null
          ? existingResult.marks
          : "",
      maxMarks: existingResult?.maxMarks || (exam as any).maxMarks || 100,
      attendanceMarks:
        existingResult?.attendanceMarks !== undefined && existingResult?.attendanceMarks !== null
          ? existingResult.attendanceMarks
          : enr.attendanceMarks !== undefined && enr.attendanceMarks !== null
          ? enr.attendanceMarks
          : "",
      percentage: existingResult?.percentage !== undefined ? existingResult.percentage : null,
      grade: existingResult?.grade || "",
      feedback: existingResult?.feedback || "",
      gradedAt: existingResult?.gradedAt || null,
      isGraded:
        existingResult !== undefined &&
        existingResult.marks !== null &&
        existingResult.marks !== undefined,
    };
  });

  return {
    exam: {
      _id: exam._id.toString(),
      title: exam.title,
      courseId: courseId ? courseId.toString() : "",
      courseTitle: course?.title || "Course",
      courseCode: course?.code || "",
      date: exam.date,
      duration: exam.duration,
      location: exam.location,
      type: exam.type,
      status: exam.status,
      maxMarks: (exam as any).maxMarks || 100,
      weight,
      hasAttendance: Boolean(attendanceItem),
      attendanceItem: attendanceItem
        ? {
            name: attendanceItem.name || "Attendance & Participation",
            weight: Number(attendanceItem.weight) || 10,
          }
        : null,
      gradedCount: (exam as any).results?.length || 0,
      totalEnrolled: enrollments.length,
    },
    students,
  };
}

/**
 * Saves exam marks for students and optionally publishes results directly to students.
 */
export async function saveExamGrades(
  examId: string,
  userId: string,
  userName: string,
  input: {
    grades: Array<{
      studentId: string;
      marks: number | string;
      attendanceMarks?: number | string;
      feedback?: string;
      maxMarks?: number;
    }>;
    sendToStudents?: boolean;
    maxMarks?: number;
  }
) {
  await connectToDatabase();

  const exam = await Exam.findById(examId).populate("courseId", "title");
  if (!exam) {
    throw new NotFoundError("Exam not found");
  }

  const effectiveMax = Number(input.maxMarks) || (exam as any).maxMarks || 100;
  (exam as any).maxMarks = effectiveMax;

  const validGrades = (input.grades || []).filter(
    (g) => g.marks !== "" && g.marks !== null && g.marks !== undefined && !isNaN(Number(g.marks))
  );

  const processedResults = validGrades.map((g) => {
    const marksNum = Math.max(0, Math.min(effectiveMax, Number(g.marks)));
    const pct = effectiveMax > 0 ? Math.round((marksNum / effectiveMax) * 100) : 0;
    let letterGrade = "F";
    if (pct >= 80) letterGrade = "A";
    else if (pct >= 70) letterGrade = "B";
    else if (pct >= 60) letterGrade = "C";
    else if (pct >= 50) letterGrade = "D";
    else letterGrade = "F";

    const attMarks =
      g.attendanceMarks !== "" &&
      g.attendanceMarks !== null &&
      g.attendanceMarks !== undefined &&
      !isNaN(Number(g.attendanceMarks))
        ? Number(g.attendanceMarks)
        : null;

    return {
      studentId: new mongoose.Types.ObjectId(g.studentId),
      marks: marksNum,
      maxMarks: effectiveMax,
      attendanceMarks: attMarks,
      percentage: pct,
      grade: letterGrade,
      feedback: g.feedback ? g.feedback.trim() : "",
      gradedAt: new Date(),
    };
  });

  (exam as any).results = processedResults;

  // Sync attendance marks to Enrollments if entered
  for (const g of input.grades || []) {
    if (
      g.attendanceMarks !== "" &&
      g.attendanceMarks !== null &&
      g.attendanceMarks !== undefined &&
      !isNaN(Number(g.attendanceMarks))
    ) {
      await Enrollment.updateOne(
        { courseId: exam.courseId, userId: g.studentId },
        { $set: { attendanceMarks: Number(g.attendanceMarks) } }
      );
    }
  }

  if (input.sendToStudents) {
    exam.status = "completed";

    // Send notifications to all students who received marks
    const courseTitle = (exam.courseId as any)?.title || "Course";
    const notifications = processedResults.map((r) => ({
      userId: r.studentId,
      type: "grading",
      message: `Final Exam Marks Published: "${exam.title}" in ${courseTitle} (${r.marks}/${r.maxMarks} - Grade ${r.grade})`,
      link: "/grades",
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  }

  await exam.save();

  return {
    exam,
    savedCount: processedResults.length,
    isPublished: !!input.sendToStudents,
  };
}
