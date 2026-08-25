import { connectToDatabase } from "@/lib/db";
import Course from "@/lib/models/Course";
import Announcement from "@/lib/models/Announcement";
import Notification from "@/lib/models/Notification";
import Enrollment from "@/lib/models/Enrollment";
import Batch from "@/lib/models/Batch";
import Assignment from "@/lib/models/Assignment";
import Exam from "@/lib/models/Exam";
import Submission from "@/lib/models/Submission";
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
 * Retrieves enrolled students for a lecturer's courses with dynamically calculated course progress.
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
    .populate("courseId", "title category assessmentItems gradingBreakdown")
    .sort({ createdAt: -1 })
    .lean();

  const validEnrollments = enrollments.filter((e: any) => e.userId != null);

  const courseIds = Array.from(
    new Set(
      validEnrollments
        .map((e: any) => e.courseId?._id?.toString() || e.courseId?.toString())
        .filter(Boolean)
    )
  );

  const userIds = Array.from(
    new Set(
      validEnrollments
        .map((e: any) => e.userId?._id?.toString() || e.userId?.toString())
        .filter(Boolean)
    )
  );

  const [allAssignments, allExams, allSubmissions] = await Promise.all([
    courseIds.length > 0 ? Assignment.find({ courseId: { $in: courseIds } }).lean() : [],
    courseIds.length > 0 ? Exam.find({ courseId: { $in: courseIds } }).lean() : [],
    courseIds.length > 0 && userIds.length > 0
      ? Submission.find({
          courseId: { $in: courseIds },
          studentId: { $in: userIds },
        }).lean()
      : [],
  ]);

  const bulkUpdates: any[] = [];

  const students = validEnrollments.map((e: any) => {
    const user = e.userId;
    const course = e.courseId;
    const cIdStr = course?._id?.toString() || e.courseId?.toString() || "";
    const uIdStr = user?._id?.toString() || e.userId?.toString() || "";

    const courseAssignments = allAssignments.filter(
      (a: any) => (a.courseId?._id ? a.courseId._id.toString() : a.courseId?.toString()) === cIdStr
    );
    const courseExams = allExams.filter(
      (ex: any) => (ex.courseId?._id ? ex.courseId._id.toString() : ex.courseId?.toString()) === cIdStr
    );

    const completedAssignments = courseAssignments.filter((assign: any) => {
      const assignIdStr = assign._id.toString();
      const sub = allSubmissions.find((s: any) => {
        const sAssignId = s.assignmentId?._id ? s.assignmentId._id.toString() : s.assignmentId?.toString();
        const sStudentId = s.studentId?._id ? s.studentId._id.toString() : s.studentId?.toString();
        const sCourseId = s.courseId?._id ? s.courseId._id.toString() : s.courseId?.toString();
        return sAssignId === assignIdStr && sStudentId === uIdStr && (!sCourseId || sCourseId === cIdStr);
      });
      return (
        sub &&
        (sub.status === "submitted" ||
          sub.status === "graded" ||
          sub.status === "late" ||
          (sub.files && sub.files.length > 0) ||
          sub.content)
      );
    });

    const completedExams = courseExams.filter((ex: any) => {
      const res = (ex.results || []).find(
        (r: any) => (r.studentId?._id ? r.studentId._id.toString() : r.studentId?.toString()) === uIdStr
      );
      return (
        (res && res.marks !== null && res.marks !== undefined) ||
        ex.status === "completed" ||
        ex.status === "graded"
      );
    });

    let calculatedProgress = 0;

    if (course?.assessmentItems && Array.isArray(course.assessmentItems) && course.assessmentItems.length > 0) {
      let totalWeight = 0;
      let earnedWeight = 0;

      for (const item of course.assessmentItems) {
        const weight = Number(item.weight) || 0;
        if (weight <= 0) continue;
        totalWeight += weight;

        if (item.type === "attendance") {
          if (
            (e as any).attendanceMarks !== undefined &&
            (e as any).attendanceMarks !== null &&
            Number((e as any).attendanceMarks) > 0
          ) {
            earnedWeight += weight;
          }
        } else if (item.type === "exam") {
          if (completedExams.length > 0) {
            earnedWeight += weight;
          }
        } else {
          const matchedAssignment = courseAssignments.find(
            (a: any) =>
              a.title.trim().toLowerCase() === (item.name || "").trim().toLowerCase() ||
              (item.type && a.category?.toLowerCase() === item.type.toLowerCase())
          );
          if (matchedAssignment) {
            const isDone = completedAssignments.some(
              (ca: any) => ca._id.toString() === matchedAssignment._id.toString()
            );
            if (isDone) {
              earnedWeight += weight;
            }
          } else if (completedAssignments.length > 0) {
            const ratio = courseAssignments.length > 0 ? completedAssignments.length / courseAssignments.length : 0;
            earnedWeight += weight * ratio;
          }
        }
      }

      if (totalWeight > 0) {
        calculatedProgress = Math.round((earnedWeight / totalWeight) * 100);
      }
    }

    if (calculatedProgress === 0) {
      const totalDeliverables = courseAssignments.length + courseExams.length;
      const completedDeliverables = completedAssignments.length + completedExams.length;

      if (totalDeliverables > 0) {
        calculatedProgress = Math.round((completedDeliverables / totalDeliverables) * 100);
      }
    }

    if (
      typeof e.progress === "number" &&
      e.progress > calculatedProgress &&
      courseAssignments.length === 0 &&
      courseExams.length === 0
    ) {
      calculatedProgress = e.progress;
    }

    const finalProgress = Math.min(100, Math.max(0, calculatedProgress));

    if (e.progress !== finalProgress) {
      bulkUpdates.push({
        updateOne: {
          filter: { _id: e._id },
          update: { $set: { progress: finalProgress } },
        },
      });
    }

    return {
      id: e._id.toString(),
      studentId: user._id?.toString() || "",
      name: user.name || "Unknown Student",
      email: user.email || "",
      course: course?.title || "Untitled Course",
      courseId: course?._id?.toString() || "",
      courseCategory: course?.category || "",
      progress: finalProgress,
      status:
        user.status === "active"
          ? "Active"
          : user.status
          ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
          : "Active",
      enrolledAt: e.createdAt,
    };
  });

  if (bulkUpdates.length > 0) {
    try {
      await Enrollment.bulkWrite(bulkUpdates, { ordered: false });
    } catch (err) {
      console.warn("Failed to bulk update enrollment progress:", err);
    }
  }

  return { students, total: students.length };
}
