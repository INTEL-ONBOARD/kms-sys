import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { connectToDatabase } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import Assignment from "@/models/Assignment";
import LiveClass from "@/models/LiveClass";
import Exam from "@/models/Exam";
import Announcement from "@/models/Announcement";
import CourseMaterial from "@/models/CourseMaterial";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const token = await requireRole(req, ["student", "super_admin", "admin"]);
    const userId = token.id;

    await connectToDatabase();

    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : userId;

    const enrollments = await Enrollment.find({
      $or: [{ userId: userObjectId }, { userId }],
    })
      .populate({ path: "courseId", model: Course })
      .sort({ createdAt: -1 })
      .lean();

    const validEnrollments = enrollments.filter((e: any) => e.courseId != null);
    const validCourses = validEnrollments.map((e: any) => e.courseId);
    const validCourseIds = validCourses.map((c: any) => c._id);

    const [assignmentsList, liveClassesList, examsList, announcementsList, materialsList] =
      await Promise.all([
        Assignment.find({ courseId: { $in: validCourseIds } }).sort({ dueDate: 1 }).lean(),
        LiveClass.find({ courseId: { $in: validCourseIds } }).sort({ startTime: 1 }).lean(),
        Exam.find({ courseId: { $in: validCourseIds } }).sort({ date: 1 }).lean(),
        Announcement.find({ courseId: { $in: validCourseIds } }).sort({ createdAt: -1 }).lean(),
        CourseMaterial.find({ courseId: { $in: validCourseIds }, isPublished: true })
          .sort({ createdAt: -1 })
          .lean(),
      ]);

    const myCourses = validEnrollments.map((enrollment: any) => {
      const course = enrollment.courseId;
      const cIdStr = course._id ? course._id.toString() : "";
      const progress = typeof enrollment.progress === "number" ? enrollment.progress : 0;

      const courseMaterials = materialsList
        .filter((m: any) => m.courseId?.toString() === cIdStr)
        .map((m: any) => ({
          _id: m._id.toString(),
          title: m.title,
          description: m.description || "",
          materialType: m.materialType || "notes",
          fileName: m.fileName,
          fileUrl: m.fileUrl,
          fileSize: m.fileSize || 0,
          mimeType: m.mimeType || "application/octet-stream",
          createdAt: m.createdAt
            ? new Date(m.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "",
        }));

      const courseAssignments = assignmentsList
        .filter((a: any) => a.courseId?.toString() === cIdStr)
        .map((a: any) => ({
          _id: a._id.toString(),
          title: a.title,
          category: a.category || "Homework",
          dueDate: a.dueDate
            ? new Date(a.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "TBA",
          maxPoints: a.maxPoints || 100,
          status: a.status || "open",
        }));

      const courseLiveClasses = liveClassesList
        .filter((lc: any) => lc.courseId?.toString() === cIdStr)
        .map((lc: any) => ({
          _id: lc._id.toString(),
          title: lc.title,
          startTime: lc.startTime
            ? new Date(lc.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "",
          date: lc.startTime
            ? new Date(lc.startTime).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : "",
          meetingLink: lc.meetingLink || "",
          status: lc.status || "upcoming",
        }));

      const courseExams = examsList
        .filter((ex: any) => ex.courseId?.toString() === cIdStr)
        .map((ex: any) => ({
          _id: ex._id.toString(),
          title: ex.title,
          date: ex.date
            ? new Date(ex.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "TBA",
          duration: ex.duration || 120,
          location: ex.location || "Online Hall A",
        }));

      const courseAnnouncements = announcementsList
        .filter((an: any) => an.courseId?.toString() === cIdStr)
        .map((an: any) => ({
          _id: an._id.toString(),
          message: an.message,
          createdAt: an.createdAt
            ? new Date(an.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Recent",
        }));

      const modules = [
        {
          moduleNumber: "01",
          title: `Module 1: Foundations & Theoretical Frameworks in ${course.title}`,
          description: "Introduction to fundamental principles, domain concepts, history, and core terminology.",
          lessonsCount: 6,
          duration: "12 Hours",
          status: progress >= 25 ? "Completed" : "In Progress",
          topics: [
            "Overview and Course Prerequisites",
            "Theoretical Foundation & Framework Analysis",
            "Key Concepts, Standards & Best Practices",
            "Introductory Practical Workshop",
          ],
        },
        {
          moduleNumber: "02",
          title: `Module 2: Practical Techniques, Tools & Implementation`,
          description: "Deep dive into hands-on methodologies, essential software tools, workflows, and lab exercises.",
          lessonsCount: 8,
          duration: "18 Hours",
          status: progress >= 50 ? "Completed" : progress >= 25 ? "In Progress" : "Upcoming",
          topics: [
            "Core Technical Architecture & Tooling",
            "Guided Hands-on Lab Demonstrations",
            "Problem Solving & Optimization Strategies",
            "Intermediate Implementation Review",
          ],
        },
        {
          moduleNumber: "03",
          title: `Module 3: Advanced Applications, Architecture & Case Studies`,
          description: "Industry standard workflows, advanced architectures, real-world case analysis, and group tasks.",
          lessonsCount: 8,
          duration: "20 Hours",
          status: progress >= 75 ? "Completed" : progress >= 50 ? "In Progress" : "Upcoming",
          topics: [
            "Advanced Industry Best Practices",
            "Real-World Case Study Investigations",
            "Design Patterns, Scaling & Compliance",
            "Pre-Assessment Peer Reviews",
          ],
        },
        {
          moduleNumber: "04",
          title: `Module 4: Capstone Evaluation & Comprehensive Assessment`,
          description: "Final coursework delivery, project synthesis, portfolio development, and exam preparation.",
          lessonsCount: 4,
          duration: "14 Hours",
          status: progress >= 100 ? "Completed" : progress >= 75 ? "In Progress" : "Upcoming",
          topics: [
            "Project Synthesis & Deliverables Refinement",
            "Submission Review & Quality Assurance",
            "Final Portfolio & Examination Prep",
            "Course Feedback & Next Steps",
          ],
        },
      ];

      return {
        _id: cIdStr,
        title: course.title || "Untitled Course",
        code: `WISE-${cIdStr.substring(0, 4).toUpperCase()}`,
        category: course.category || "General",
        instructor: course.instructor || "University Faculty",
        description:
          course.description ||
          `Welcome to ${course.title}. This course equips students with practical skills, rigorous theoretical knowledge, and real-world proficiency to excel in their academic and professional development.`,
        price: course.price || "Free",
        status: course.status || "active",
        published: course.published ?? true,
        progress,
        enrollmentId: enrollment._id?.toString() || enrollment._id,
        credits: 4,
        semester: "Semester 01",
        enrolledAt: enrollment.createdAt
          ? new Date(enrollment.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Active",
        modules,
        assignments: courseAssignments,
        assignmentCount: courseAssignments.length,
        materials: courseMaterials,
        materialCount: courseMaterials.length,
        liveClasses: courseLiveClasses,
        liveClassCount: courseLiveClasses.length,
        exams: courseExams,
        examCount: courseExams.length,
        announcements: courseAnnouncements,
        announcementCount: courseAnnouncements.length,
      };
    });

    return successResponse({ courses: myCourses, total: myCourses.length }, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/student/my-courses");
  }
}