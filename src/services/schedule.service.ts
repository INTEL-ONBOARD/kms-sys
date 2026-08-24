import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Course from "@/lib/models/Course";
import LiveClass from "@/lib/models/LiveClass";
import CourseMaterial from "@/lib/models/CourseMaterial";
import Notification from "@/lib/models/Notification";
import Enrollment from "@/lib/models/Enrollment";
import { BadRequestError, NotFoundError } from "@/lib/core/errors";

/**
 * Retrieves scheduled live classes for a lecturer or course.
 */
export async function getLecturerSchedule(
  userId: string,
  userName: string,
  options?: { dateParam?: string | null; fetchAll?: boolean }
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
    return { schedule: [] };
  }

  const query: Record<string, unknown> = { courseId: { $in: courseIds } };

  if (options?.dateParam) {
    const queryDate = new Date(options.dateParam);
    const dayStart = new Date(queryDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(queryDate);
    dayEnd.setHours(23, 59, 59, 999);

    query.startTime = { $gte: dayStart, $lte: dayEnd };
  } else if (!options?.fetchAll) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    query.startTime = { $gte: todayStart, $lte: todayEnd };
  }

  const schedule = await LiveClass.find(query)
    .populate({ path: "courseId", model: Course, select: "title category" })
    .populate({
      path: "materialId",
      model: CourseMaterial,
      select: "title fileName fileUrl fileSize mimeType materialType",
    })
    .populate({
      path: "materials",
      model: CourseMaterial,
      select: "title fileName fileUrl fileSize mimeType materialType",
    })
    .sort({ startTime: 1 })
    .lean();

  return { schedule };
}

/**
 * Creates a scheduled live class.
 */
export async function createLiveClass(
  userId: string,
  userName: string,
  input: {
    title: string;
    courseId?: string;
    date?: string;
    time?: string;
    duration?: number;
    meetingLink?: string;
    materialId?: string;
    materials?: string[];
    description?: string;
  }
) {
  await connectToDatabase();

  const lecturerCourses = await Course.find({
    $or: [
      { instructorId: userId },
      ...(userName ? [{ instructor: { $regex: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } }] : []),
    ],
  }).lean();

  let targetCourseId = input.courseId;
  if (!targetCourseId && lecturerCourses.length > 0) {
    targetCourseId = lecturerCourses[0]._id.toString();
  }

  if (!targetCourseId) {
    throw new BadRequestError("You do not have any courses assigned to schedule live classes for. Please contact an administrator.");
  }

  let startTimeDate = new Date();
  if (input.date) {
    const [year, month, day] = input.date.split("-").map(Number);
    if (year && month && day) {
      startTimeDate = new Date(year, month - 1, day);
    }
  }

  if (input.time) {
    const [hours, minutes] = input.time.split(":").map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      startTimeDate.setHours(hours, minutes, 0, 0);
    }
  }

  // Block scheduling for past dates and times (with 60-second network buffer)
  if (startTimeDate.getTime() < Date.now() - 60000) {
    throw new BadRequestError("Cannot schedule a live class for a past date or time. Please select a future date and time.");
  }

  const classDuration = Number(input.duration) || 60;
  const endTimeDate = new Date(startTimeDate.getTime() + classDuration * 60 * 1000);

  const materialsList = Array.isArray(input.materials)
    ? input.materials
    : input.materialId
    ? [input.materialId]
    : [];

  const liveClass = await LiveClass.create({
    title: input.title.trim(),
    description: input.description || "Interactive online lecture session.",
    courseId: targetCourseId,
    instructor: userName || "Course Lecturer",
    startTime: startTimeDate,
    endTime: endTimeDate,
    meetingLink: input.meetingLink || "https://meet.google.com/demo-room",
    materialId: input.materialId || materialsList[0] || undefined,
    materials: materialsList,
    status: "upcoming",
  });

  const populatedLiveClass = await LiveClass.findById(liveClass._id)
    .populate({ path: "courseId", model: Course, select: "title category" })
    .populate({
      path: "materialId",
      model: CourseMaterial,
      select: "title fileName fileUrl fileSize mimeType materialType",
    })
    .populate({
      path: "materials",
      model: CourseMaterial,
      select: "title fileName fileUrl fileSize mimeType materialType",
    })
    .lean();

  try {
    const enrollments = await Enrollment.find({ courseId: targetCourseId }).lean();
    if (enrollments.length > 0) {
      const course = await Course.findById(targetCourseId).lean();
      const courseTitle = course?.title || "Course";
      const notifications = enrollments.map((e) => ({
        userId: e.userId,
        type: "class",
        message: `Live Class Scheduled: "${input.title}" in ${courseTitle} at ${startTimeDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        link: "/calendar",
      }));
      await Notification.insertMany(notifications);
    }
  } catch (notifErr) {
    console.warn("Could not dispatch notifications:", notifErr);
  }

  return populatedLiveClass;
}

/**
 * Updates a live class with recordings, notes, or status.
 */
export async function updateLiveClass(
  classId: string,
  input: {
    recordingUrl?: string;
    description?: string;
    resources?: string;
    materialId?: string;
    materials?: string[];
    status?: string;
  }
) {
  await connectToDatabase();

  const liveClass = await LiveClass.findById(classId);
  if (!liveClass) {
    throw new NotFoundError("Live class not found");
  }

  if (input.recordingUrl !== undefined) liveClass.recordingUrl = input.recordingUrl;
  if (input.description !== undefined) liveClass.description = input.description;
  if (input.resources !== undefined) {
    liveClass.resources = Array.isArray(input.resources)
      ? input.resources
      : [input.resources];
  }
  if (input.materialId !== undefined) {
    liveClass.materialId = mongoose.Types.ObjectId.isValid(input.materialId)
      ? new mongoose.Types.ObjectId(input.materialId)
      : undefined;
  }
  if (input.materials !== undefined) {
    const matArray = Array.isArray(input.materials) ? input.materials : [input.materials];
    liveClass.materials = matArray
      .filter((m) => mongoose.Types.ObjectId.isValid(m))
      .map((m) => new mongoose.Types.ObjectId(m));
  }
  if (input.status !== undefined && ["upcoming", "live", "ended", "cancelled"].includes(input.status)) {
    liveClass.status = input.status as "upcoming" | "live" | "ended" | "cancelled";
  }

  await liveClass.save();

  if (input.recordingUrl) {
    const course = await Course.findById(liveClass.courseId).lean();
    const courseTitle = course?.title || "Course";
    const enrollments = await Enrollment.find({ courseId: liveClass.courseId }).lean();
    if (enrollments.length > 0) {
      const notifications = enrollments.map((e) => ({
        userId: e.userId,
        type: "class",
        message: `Lecture Recording Uploaded: Missed session recording for "${liveClass.title}" in ${courseTitle} is now available in Playback Mode`,
        link: "/calendar",
      }));
      await Notification.insertMany(notifications);
    }
  }

  return liveClass;
}
