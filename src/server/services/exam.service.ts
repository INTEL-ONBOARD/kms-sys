import { connectToDatabase } from "@/lib/db";
import Exam from "@/models/Exam";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Notification from "@/models/Notification";
import { NotFoundError } from "../core/errors";
import {
  PaginationParams,
  buildPaginationMeta,
  createSafeSearchRegex,
} from "../core/pagination";
import { CreateExamInput, UpdateExamInput } from "../dtos/exam.dto";

/**
 * Retrieves exams for lecturer's courses.
 */
export async function getLecturerExams(
  userId: string,
  userName: string,
  pagination: PaginationParams
) {
  await connectToDatabase();

  const nameRegex = createSafeSearchRegex(userName);
  const courses = await Course.find({
    $or: [{ instructorId: userId }, { instructor: { $regex: nameRegex } }],
  }).lean();

  const courseIds = courses.map((c) => c._id);

  const query: Record<string, any> = { courseId: { $in: courseIds } };
  if (pagination.search) {
    const searchRegex = createSafeSearchRegex(pagination.search);
    query.title = searchRegex;
  }

  const total = await Exam.countDocuments(query);
  const exams = await Exam.find(query)
    .populate("courseId", "title category")
    .sort({ [pagination.sortBy || "date"]: pagination.sortOrder })
    .skip(pagination.skip)
    .limit(pagination.limit)
    .lean();

  return {
    exams,
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

  const examDate = input.date
    ? new Date(input.date)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const exam = await Exam.create({
    title: input.title.trim(),
    courseId: targetCourseId,
    date: examDate,
    duration: Number(input.duration) || 120,
    location: input.location || "Online Hall A",
    type: input.type || "quiz",
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
      message: `New Exam Scheduled: "${input.title}" in ${courseTitle} on ${examDate.toLocaleDateString()}`,
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

  const updateFields: Record<string, any> = {};
  if (input.title) updateFields.title = input.title.trim();
  if (input.date) updateFields.date = new Date(input.date);
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
