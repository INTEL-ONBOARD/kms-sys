import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import LiveClass, { LiveClassDoc } from "@/models/LiveClass";
import CourseMaterial from "@/models/CourseMaterial";
import Notification from "@/models/Notification";
import Enrollment from "@/models/Enrollment";
import { BadRequestError, NotFoundError } from "../core/errors";

/**
 * Retrieves scheduled live/physical classes for a lecturer or course.
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
    .populate({ path: "courseId", model: Course, select: "title category instructor" })
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
 * Creates a scheduled class (physical or online).
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
    classType?: "online" | "physical";
    location?: string;
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
    throw new BadRequestError("You do not have any courses assigned to schedule classes for. Please contact an administrator.");
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
    throw new BadRequestError("Cannot schedule a class for a past date or time. Please select a future date and time.");
  }

  const classDuration = Number(input.duration) || 60;
  const endTimeDate = new Date(startTimeDate.getTime() + classDuration * 60 * 1000);

  const materialsList = Array.isArray(input.materials)
    ? input.materials
    : input.materialId
    ? [input.materialId]
    : [];

  const classType = input.classType === "physical" ? "physical" : "online";
  const location = classType === "physical" ? (input.location || "Lecture Hall 1").trim() : (input.location || "Online").trim();
  const meetingLink = classType === "online" ? (input.meetingLink || "https://meet.google.com/demo-room").trim() : "";

  const liveClass = await LiveClass.create({
    title: input.title.trim(),
    description: input.description || (classType === "physical" ? "On-campus physical lecture session." : "Interactive online lecture session."),
    courseId: targetCourseId,
    instructor: userName || "Course Lecturer",
    startTime: startTimeDate,
    endTime: endTimeDate,
    classType,
    location,
    meetingLink,
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
      const timeStr = startTimeDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const venueStr = classType === "physical" ? `at ${location}` : "Online";
      const notifications = enrollments.map((e) => ({
        userId: e.userId,
        type: "class",
        message: `${classType === "physical" ? "Physical Class" : "Live Class"} Scheduled: "${input.title}" in ${courseTitle} at ${timeStr} (${venueStr})`,
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
 * Updates or Reschedules a class (Physical or Online) with recordings, notes, times, or status.
 */
export async function updateLiveClass(
  classId: string,
  input: {
    title?: string;
    date?: string;
    time?: string;
    startTime?: string | Date;
    endTime?: string | Date;
    duration?: number;
    classType?: "online" | "physical";
    location?: string;
    meetingLink?: string;
    recordingUrl?: string;
    description?: string;
    resources?: string | string[];
    materialId?: string;
    materials?: string[];
    status?: string;
  }
) {
  await connectToDatabase();

  const liveClass = await LiveClass.findById(classId);
  if (!liveClass) {
    throw new NotFoundError("Class session not found");
  }

  const prevStartTime = new Date(liveClass.startTime);
  const prevEndTime = new Date(liveClass.endTime);
  const prevLocation = liveClass.location || "";
  const prevClassType = (liveClass as any).classType || "online";

  let hasRescheduledTiming = false;

  // Handle explicit date + time or startTime/endTime updates
  if (input.date || input.time) {
    const origStart = new Date(liveClass.startTime);
    let newStart = new Date(origStart);

    if (input.date) {
      const [year, month, day] = input.date.split("-").map(Number);
      if (year && month && day) {
        newStart = new Date(year, month - 1, day, newStart.getHours(), newStart.getMinutes());
      }
    }

    if (input.time) {
      const [hours, minutes] = input.time.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        newStart.setHours(hours, minutes, 0, 0);
      }
    }

    const dur = input.duration ? Number(input.duration) : Math.max(30, Math.round((prevEndTime.getTime() - prevStartTime.getTime()) / (60 * 1000)));
    const newEnd = new Date(newStart.getTime() + dur * 60 * 1000);

    liveClass.startTime = newStart;
    liveClass.endTime = newEnd;
    hasRescheduledTiming = true;
  } else if (input.startTime || input.endTime) {
    if (input.startTime) {
      liveClass.startTime = new Date(input.startTime);
      hasRescheduledTiming = true;
    }
    if (input.endTime) {
      liveClass.endTime = new Date(input.endTime);
      hasRescheduledTiming = true;
    }
  }

  if (input.title !== undefined && input.title.trim()) {
    liveClass.title = input.title.trim();
  }
  if (input.classType !== undefined) {
    (liveClass as any).classType = input.classType;
  }
  if (input.location !== undefined) {
    (liveClass as any).location = input.location.trim();
  }
  if (input.meetingLink !== undefined) {
    liveClass.meetingLink = input.meetingLink.trim();
  }
  if (input.recordingUrl !== undefined) {
    liveClass.recordingUrl = input.recordingUrl.trim();
  }
  if (input.description !== undefined) {
    liveClass.description = input.description.trim();
  }
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
  if (input.status !== undefined && ["upcoming", "live", "ended", "cancelled", "rescheduled"].includes(input.status)) {
    liveClass.status = input.status as any;
  } else if (hasRescheduledTiming && liveClass.status === "upcoming") {
    // Keep status as upcoming
  }

  await liveClass.save();

  // Send Reschedule / Recording Notifications to Enrolled Students
  const course = await Course.findById(liveClass.courseId).lean();
  const courseTitle = course?.title || "Course";
  const enrollments = await Enrollment.find({ courseId: liveClass.courseId }).lean();

  if (enrollments.length > 0) {
    const newStartDate = new Date(liveClass.startTime);
    const newEndDate = new Date(liveClass.endTime);

    // If timing or location was rescheduled
    if (hasRescheduledTiming || (input.location !== undefined && input.location !== prevLocation)) {
      const dateFormatted = newStartDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const startTimeFormatted = newStartDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const endTimeFormatted = newEndDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const currType = (liveClass as any).classType || "online";
      const venueStr = currType === "physical" ? `at ${(liveClass as any).location || "Campus Hall"}` : "Online (Live Session)";

      const notifications = enrollments.map((e) => ({
        userId: e.userId,
        type: "class",
        message: `Class Rescheduled: "${liveClass.title}" in ${courseTitle} is rescheduled to ${dateFormatted} (${startTimeFormatted} – ${endTimeFormatted}) ${venueStr}`,
        link: "/calendar",
      }));
      await Notification.insertMany(notifications);
    } else if (input.recordingUrl) {
      const notifications = enrollments.map((e) => ({
        userId: e.userId,
        type: "class",
        message: `Lecture Recording Uploaded: Missed session recording for "${liveClass.title}" in ${courseTitle} is now available in Playback Mode`,
        link: "/calendar",
      }));
      await Notification.insertMany(notifications);
    } else if (input.status === "cancelled") {
      const notifications = enrollments.map((e) => ({
        userId: e.userId,
        type: "class",
        message: `Class Cancelled: Session "${liveClass.title}" in ${courseTitle} scheduled for ${newStartDate.toLocaleDateString()} has been cancelled by the lecturer.`,
        link: "/calendar",
      }));
      await Notification.insertMany(notifications);
    }
  }

  const populated = await LiveClass.findById(liveClass._id)
    .populate({ path: "courseId", model: Course, select: "title category instructor" })
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

  return populated;
}

/**
 * Deletes or cancels a scheduled live class session.
 */
export async function deleteLiveClass(classId: string) {
  await connectToDatabase();

  const liveClass = await LiveClass.findById(classId);
  if (!liveClass) {
    throw new NotFoundError("Class session not found");
  }

  const course = await Course.findById(liveClass.courseId).lean();
  const courseTitle = course?.title || "Course";
  const enrollments = await Enrollment.find({ courseId: liveClass.courseId }).lean();

  await LiveClass.findByIdAndDelete(classId);

  if (enrollments.length > 0) {
    const sessionDate = new Date(liveClass.startTime).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const notifications = enrollments.map((e) => ({
      userId: e.userId,
      type: "class",
      message: `Class Cancelled: "${liveClass.title}" (${sessionDate}) in ${courseTitle} has been removed from the schedule.`,
      link: "/calendar",
    }));
    await Notification.insertMany(notifications);
  }

  return { id: classId };
}

