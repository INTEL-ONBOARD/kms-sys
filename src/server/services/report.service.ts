import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import Assignment from "@/models/Assignment";
import Submission from "@/models/Submission";
import Exam from "@/models/Exam";
import User from "@/models/User";

/**
 * Calculates student grades, GPA, CGPA, and coursework breakdown.
 */
export async function getStudentReport(
  userId: string,
  userName: string,
  requestedSemester = "All",
  courseFilter?: string
) {
  await connectToDatabase();

  // 1. Fetch student enrollments populated with course details
  const enrollments = await Enrollment.find({ userId })
    .populate({
      path: "courseId",
      model: Course,
    })
    .sort({ createdAt: -1 })
    .lean();

  const validEnrollments = enrollments.filter((e: any) => e.courseId != null);
  const validCourseIds = validEnrollments.map((e: any) => e.courseId._id);

  // 2. Fetch all assignments, student submissions, and exams for enrolled courses in parallel
  const [assignments, submissions, exams] = await Promise.all([
    Assignment.find({ courseId: { $in: validCourseIds } }).lean(),
    Submission.find({ studentId: userId, courseId: { $in: validCourseIds } }).lean(),
    Exam.find({ courseId: { $in: validCourseIds } }).lean(),
  ]);

  // 3. Map dynamic course grades - ONLY show published results, and ONLY show overall marks once all assessments are finished
  const allGrades = validEnrollments.map((enrollment: any, index: number) => {
    const course = enrollment.courseId;
    const cIdStr = course._id ? course._id.toString() : "";

    // Dynamic Assessment Items and weights configured by the lecturer
    const courseItems =
      course.assessmentItems && course.assessmentItems.length > 0
        ? course.assessmentItems
        : [
            { name: "Assignments", type: "assignment", weight: course.gradingBreakdown?.assignmentsWeight ?? 20 },
            { name: "Course work 1", type: "coursework", weight: course.gradingBreakdown?.courseWorkWeight ?? 30 },
            { name: "Final exam", type: "exam", weight: course.gradingBreakdown?.finalExamWeight ?? 40 },
            { name: "Attendance", type: "attendance", weight: course.gradingBreakdown?.attendanceWeight ?? 10 },
          ];

    const courseSemester = course.semester || (index % 2 === 0 ? "Semester 01" : "Semester 02");
    const courseCode = course.code || `WISE-${cIdStr.substring(0, 4).toUpperCase()}/CO`;

    const courseSubmissions = submissions.filter((s: any) => s.courseId?.toString() === cIdStr);
    const gradedSubmissions = courseSubmissions.filter(
      (s: any) => s.status === "graded" && typeof s.grade === "number" && s.grade !== null
    );

    const courseExams = exams.filter((e: any) => e.courseId?.toString() === cIdStr);

    let totalEarnedPoints = 0;
    let publishedCount = 0;

    const itemBreakdown = courseItems.map((item: any, itemIdx: number) => {
      const w = Number(item.weight) || 0;
      let isPublished = false;
      let earnedNum = 0;

      if (item.type === "assignment") {
        const sub = gradedSubmissions[itemIdx] || gradedSubmissions[0];
        if (sub) {
          isPublished = true;
          earnedNum = Math.min(w, Math.max(0, Math.round(((sub.grade || 0) / 100) * w)));
        }
      } else if (item.type === "coursework" || item.type === "quiz" || item.type === "project") {
        const sub = gradedSubmissions[itemIdx];
        if (sub) {
          isPublished = true;
          earnedNum = Math.min(w, Math.max(0, Math.round(((sub.grade || 0) / 100) * w)));
        }
      } else if (item.type === "exam") {
        if (
          courseExams.length > 0 &&
          courseExams.some((e: any) => e.status === "graded" || e.status === "completed") &&
          gradedSubmissions.length > 0
        ) {
          isPublished = true;
          const avgGrade =
            gradedSubmissions.reduce((acc: number, s: any) => acc + s.grade, 0) / gradedSubmissions.length;
          earnedNum = Math.min(w, Math.max(0, Math.round((avgGrade / 100) * w)));
        }
      } else if (item.type === "attendance") {
        const prog = typeof enrollment.progress === "number" ? enrollment.progress : 0;
        if (prog > 0 && gradedSubmissions.length > 0) {
          isPublished = true;
          earnedNum = Math.min(w, Math.max(1, Math.round((prog / 100) * w)));
        }
      }

      if (isPublished) {
        publishedCount++;
        totalEarnedPoints += earnedNum;
      }

      return {
        name: item.name,
        type: item.type || "assignment",
        weight: w,
        isPublished,
        status: isPublished ? "Published" : "Pending",
        score: isPublished ? `${String(earnedNum).padStart(2, "0")} / ${w}` : `-- / ${w}`,
        earned: earnedNum,
      };
    });

    const allAssessmentsCompleted = courseItems.length > 0 && publishedCount === courseItems.length;

    let letterGrade = "In Progress";
    let gradeColor = "text-amber-700 bg-amber-50 border border-amber-200";
    let gpaPoint = 0.0;

    if (allAssessmentsCompleted) {
      if (totalEarnedPoints >= 93) {
        letterGrade = "A";
        gradeColor = "text-green-600 bg-green-50 border border-green-200";
        gpaPoint = 4.0;
      } else if (totalEarnedPoints >= 88) {
        letterGrade = "A -";
        gradeColor = "text-green-500 bg-green-50 border border-green-200";
        gpaPoint = 3.7;
      } else if (totalEarnedPoints >= 82) {
        letterGrade = "B +";
        gradeColor = "text-orange-500 bg-orange-50 border border-orange-200";
        gpaPoint = 3.3;
      } else if (totalEarnedPoints >= 75) {
        letterGrade = "B";
        gradeColor = "text-blue-500 bg-blue-50 border border-blue-200";
        gpaPoint = 3.0;
      } else if (totalEarnedPoints >= 70) {
        letterGrade = "B -";
        gradeColor = "text-blue-400 bg-blue-50 border border-blue-200";
        gpaPoint = 2.7;
      } else if (totalEarnedPoints >= 65) {
        letterGrade = "C +";
        gradeColor = "text-yellow-600 bg-yellow-50 border border-yellow-200";
        gpaPoint = 2.3;
      } else if (totalEarnedPoints >= 60) {
        letterGrade = "C";
        gradeColor = "text-yellow-500 bg-yellow-50 border border-yellow-200";
        gpaPoint = 2.0;
      } else {
        letterGrade = "D";
        gradeColor = "text-red-500 bg-red-50 border border-red-200";
        gpaPoint = 1.0;
      }
    }

    const assignItem = itemBreakdown.find((i: any) => i.type === "assignment") || itemBreakdown[0];
    const cwItem =
      itemBreakdown.find((i: any) => i.type === "coursework" || i.type === "quiz" || i.type === "project") ||
      itemBreakdown[1];
    const examItem = itemBreakdown.find((i: any) => i.type === "exam") || itemBreakdown[2];
    const attItem = itemBreakdown.find((i: any) => i.type === "attendance") || itemBreakdown[3];

    return {
      id: cIdStr || index + 1,
      courseId: cIdStr,
      title: course.title || "Untitled Course",
      code: courseCode,
      assignments: assignItem ? assignItem.score : "-- / 20",
      courseWork: cwItem ? cwItem.score : "-- / 30",
      finalExam: examItem ? examItem.score : "-- / 40",
      attendance: attItem ? attItem.score : "-- / 10",
      grade: letterGrade,
      gradeColor,
      gpaPoint,
      totalPoints: allAssessmentsCompleted ? totalEarnedPoints : null,
      totalEarnedPoints,
      allAssessmentsCompleted,
      publishedCount,
      totalAssessmentCount: courseItems.length,
      hasPublishedResults: publishedCount > 0,
      assessmentItems: itemBreakdown,
      gradedCount: gradedSubmissions.length,
      semester: courseSemester,
      instructor: course.instructor || "Faculty Instructor",
    };
  });

  const availableSemesters = Array.from(new Set(allGrades.map((g) => g.semester))).sort();
  const availableCourses = Array.from(new Set(allGrades.map((g) => g.title))).sort();

  let filteredGrades =
    requestedSemester === "All" ||
    requestedSemester === "All Semesters" ||
    requestedSemester === "Select"
      ? allGrades
      : allGrades.filter((g) => g.semester === requestedSemester);

  if (courseFilter && courseFilter !== "All" && courseFilter !== "all") {
    const filterLower = courseFilter.toLowerCase();
    filteredGrades = filteredGrades.filter((g: any) => {
      const cId = g.courseId?.toString();
      const title = (g.title || "").toLowerCase();
      const code = (g.code || "").toLowerCase();
      return (
        cId === courseFilter ||
        title === filterLower ||
        title.includes(filterLower) ||
        code === filterLower
      );
    });
  }

  const completedCourses = allGrades.filter(
    (g: any) => g.allAssessmentsCompleted && typeof g.totalPoints === "number"
  );
  const avgCGPAPoints =
    completedCourses.length > 0
      ? (completedCourses.reduce((acc: number, g: any) => acc + g.gpaPoint, 0) / completedCourses.length).toFixed(1)
      : "0.0";

  const filteredCompleted = filteredGrades.filter(
    (g: any) => g.allAssessmentsCompleted && typeof g.totalPoints === "number"
  );
  const avgSemesterGPA =
    filteredCompleted.length > 0
      ? (filteredCompleted.reduce((acc: number, g: any) => acc + g.gpaPoint, 0) / filteredCompleted.length).toFixed(1)
      : avgCGPAPoints;

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;
  const currentUser = await User.findById(userObjectId).select("name email role reportApproved").lean();

  return {
    studentName: userName || "Authenticated Student",
    studentId: userId,
    semester: requestedSemester === "All" ? "All Semesters" : requestedSemester,
    gpa: avgSemesterGPA,
    cgpa: avgCGPAPoints,
    generatedAt: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    grades: filteredGrades,
    allGrades,
    availableSemesters,
    availableCourses,
    totalEnrolled: allGrades.length,
    reportApproved: !!currentUser?.reportApproved,
  };
}
