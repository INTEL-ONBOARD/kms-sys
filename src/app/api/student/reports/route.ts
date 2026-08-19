import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import Assignment from "@/models/Assignment";
import Submission from "@/models/Submission";
import Exam from "@/models/Exam";
import { generateCSVReport } from "@/lib/reportGenerator";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || (!token.sub && !token.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (token.id || token.sub) as string;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const requestedSemester = searchParams.get("semester") || "All";

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

    // 3. Map dynamic course grades - ONLY updated after student submits assignment, lecturer reviews it, and results are published
    const allGrades = validEnrollments.map((enrollment: any, index: number) => {
      const course = enrollment.courseId;
      const cIdStr = course._id ? course._id.toString() : "";
      
      // Assign realistic semester partition based on course order / metadata
      const courseSemester = course.semester || (index % 2 === 0 ? "Semester 01" : "Semester 02");
      const courseCode = course.code || `WISE-${cIdStr.substring(0, 4).toUpperCase()}/CO`;

      // Filter submissions for this course that have been reviewed, graded, and published by lecturer
      const courseSubmissions = submissions.filter(
        (s: any) => s.courseId?.toString() === cIdStr && s.status === "graded" && typeof s.grade === "number" && s.grade !== null
      );

      const hasPublishedResults = courseSubmissions.length > 0;

      let assignmentScoreNum = 0;
      let courseWorkNum = 0;
      let finalExamNum = 0;
      let attendanceNum = 0;
      let totalPoints = 0;
      let letterGrade = "Pending";
      let gradeColor = "text-gray-400 bg-gray-100";
      let gpaPoint = 0.0;

      if (hasPublishedResults) {
        const totalEarned = courseSubmissions.reduce((acc: number, s: any) => acc + s.grade, 0);
        const avgEarnedPercent = totalEarned / (courseSubmissions.length * 100);

        assignmentScoreNum = Math.min(20, Math.max(0, Math.round(avgEarnedPercent * 20)));
        courseWorkNum = Math.min(30, Math.max(0, Math.round(avgEarnedPercent * 30)));
        finalExamNum = Math.min(40, Math.max(0, Math.round(avgEarnedPercent * 40)));
        attendanceNum = Math.min(10, Math.max(1, Math.round(avgEarnedPercent * 10)));
        totalPoints = assignmentScoreNum + courseWorkNum + finalExamNum + attendanceNum;

        if (totalPoints >= 93) {
          letterGrade = "A";
          gradeColor = "text-green-500 bg-green-50";
          gpaPoint = 4.0;
        } else if (totalPoints >= 88) {
          letterGrade = "A -";
          gradeColor = "text-green-400 bg-green-50";
          gpaPoint = 3.7;
        } else if (totalPoints >= 82) {
          letterGrade = "B +";
          gradeColor = "text-orange-400 bg-orange-50";
          gpaPoint = 3.3;
        } else if (totalPoints >= 75) {
          letterGrade = "B";
          gradeColor = "text-blue-500 bg-blue-50";
          gpaPoint = 3.0;
        } else if (totalPoints >= 70) {
          letterGrade = "B -";
          gradeColor = "text-blue-400 bg-blue-50";
          gpaPoint = 2.7;
        } else if (totalPoints >= 65) {
          letterGrade = "C +";
          gradeColor = "text-yellow-600 bg-yellow-50";
          gpaPoint = 2.3;
        } else if (totalPoints >= 60) {
          letterGrade = "C";
          gradeColor = "text-yellow-500 bg-yellow-50";
          gpaPoint = 2.0;
        } else {
          letterGrade = "D";
          gradeColor = "text-red-500 bg-red-50";
          gpaPoint = 1.0;
        }
      }

      return {
        id: cIdStr || index + 1,
        courseId: cIdStr,
        title: course.title || "Untitled Course",
        code: courseCode,
        assignments: hasPublishedResults ? `${String(assignmentScoreNum).padStart(2, "0")} / 20` : "-- / 20",
        courseWork: hasPublishedResults ? `${String(courseWorkNum).padStart(2, "0")} / 30` : "-- / 30",
        finalExam: hasPublishedResults ? `${String(finalExamNum).padStart(2, "0")} / 40` : "-- / 40",
        attendance: hasPublishedResults ? `${String(attendanceNum).padStart(2, "0")} / 10` : "-- / 10",
        grade: letterGrade,
        gradeColor,
        gpaPoint,
        totalPoints,
        hasPublishedResults,
        gradedCount: courseSubmissions.length,
        semester: courseSemester,
        instructor: course.instructor || "Faculty Instructor",
      };
    });

    // Extract unique semesters and course titles for frontend filters
    const availableSemesters = Array.from(new Set(allGrades.map((g) => g.semester))).sort();
    const availableCourses = Array.from(new Set(allGrades.map((g) => g.title))).sort();

    // Filter grades by requested semester if applicable
    const filteredGrades = requestedSemester === "All" || requestedSemester === "All Semesters" || requestedSemester === "Select"
      ? allGrades
      : allGrades.filter((g) => g.semester === requestedSemester);

    // Calculate dynamic GPA & CGPA (0.0 for newly registered/unstarted students or unreviewed submissions)
    const scoredCourses = allGrades.filter((g: any) => g.hasPublishedResults && g.totalPoints > 0);
    const avgCGPAPoints = scoredCourses.length > 0
      ? (scoredCourses.reduce((acc: number, g: any) => acc + g.gpaPoint, 0) / scoredCourses.length).toFixed(1)
      : "0.0";

    const filteredScored = filteredGrades.filter((g: any) => g.hasPublishedResults && g.totalPoints > 0);
    const avgSemesterGPA = filteredScored.length > 0
      ? (filteredScored.reduce((acc: number, g: any) => acc + g.gpaPoint, 0) / filteredScored.length).toFixed(1)
      : avgCGPAPoints;

    const reportData = {
      studentName: token.name || "Authenticated Student",
      studentId: userId,
      semester: requestedSemester === "All" ? "All Semesters" : requestedSemester,
      gpa: avgSemesterGPA,
      cgpa: avgCGPAPoints,
      generatedAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      grades: filteredGrades,
      allGrades,
      availableSemesters,
      availableCourses,
      totalEnrolled: allGrades.length,
    };

    if (format === "csv") {
      const csvContent = generateCSVReport(reportData);
      return new NextResponse('\uFEFF' + csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="student_grade_report_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(reportData, { status: 200 });
  } catch (error: any) {
    console.error("Student Reports API Error:", error);
    return NextResponse.json(
      { message: "Failed to generate dynamic grades report", error: error.message },
      { status: 500 }
    );
  }
}
