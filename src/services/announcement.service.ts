import { connectToDatabase } from "@/lib/db";
import Course from "@/lib/models/Course";
import Announcement from "@/lib/models/Announcement";
import Notification from "@/lib/models/Notification";
import Enrollment from "@/lib/models/Enrollment";
import Batch from "@/lib/models/Batch";
import { NotFoundError } from "@/errors";

/**
 * Posts an announcement to a course and optionally notifies enrolled students.
 */
export async function createAnnouncement(
  lecturerId: string,
  input: {
    courseId: string;
    message: string;
    notifyStudents?: boolean;
    attachments?: any[];
  }
) {
  await connectToDatabase();

  const course = await Course.findById(input.courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  const newAnnouncement = await Announcement.create({
    courseId: input.courseId,
    lecturerId,
    message: input.message.trim(),
    notifyStudents: !!input.notifyStudents,
    attachments: input.attachments || [],
  });

  if (input.notifyStudents) {
    const enrollments = await Enrollment.find({ courseId: input.courseId }).lean();
    const notificationsToCreate = enrollments.map((e) => ({
      userId: e.userId,
      type: "announcement",
      message: `New Announcement in ${course.title}: ${input.message.substring(0, 50)}...`,
      link: "/student",
    }));

    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }
  }

  return newAnnouncement;
}

/**
 * Retrieves enrolled students for a lecturer's courses.
 */
export async function getLecturerStudents(
  userId: string,
  userName: string,
  isSuperAdmin = false,
  courseIdParam?: string | null,
  batchIdParam?: string | null
) {
  await connectToDatabase();

  let courseQuery: Record<string, any> = {
    $or: [
      { instructorId: userId },
      ...(userName ? [{ instructor: { $regex: new RegExp(`^${userName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } }] : []),
    ],
  };

  if (isSuperAdmin) {
    courseQuery = {};
  }

  const lecturerCourses = await Course.find(courseQuery).lean();
  const lecturerCourseIds = lecturerCourses.map((c) => c._id);

  if (!isSuperAdmin && lecturerCourseIds.length === 0) {
    return { students: [], total: 0 };
  }

  let enrollmentQuery: Record<string, any> = {
    courseId: { $in: lecturerCourseIds },
  };

  if (courseIdParam) {
    enrollmentQuery = { courseId: courseIdParam };
  }

  if (batchIdParam && batchIdParam !== 'all') {
    const batch = await Batch.findById(batchIdParam).lean();
    if (batch && batch.students && batch.students.length > 0) {
      enrollmentQuery.userId = { $in: batch.students };
    } else {
      return { students: [], total: 0 };
    }
  }

  const enrollments = await Enrollment.find(enrollmentQuery)
    .populate("userId", "name email status phone isActivated")
    .populate("courseId", "title category")
    .sort({ createdAt: -1 })
    .lean();

  const students = enrollments
    .filter((e: any) => e.userId != null)
    .map((e: any) => {
      const user = e.userId;
      const course = e.courseId;
      return {
        id: e._id.toString(),
        studentId: user._id?.toString() || "",
        name: user.name || "Unknown Student",
        email: user.email || "",
        course: course?.title || "Untitled Course",
        courseId: course?._id?.toString() || "",
        courseCategory: course?.category || "",
        progress: e.progress ?? 0,
        status:
          user.status === "active"
            ? "Active"
            : user.status
            ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
            : "Active",
        enrolledAt: e.createdAt,
      };
    });

  return { students, total: students.length };
}
