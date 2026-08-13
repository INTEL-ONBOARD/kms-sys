import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { generateCSVReport } from "@/lib/reportGenerator";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");
    const semester = searchParams.get("semester") || "All Semesters";

    // Sample default academic performance data for student grade report
    const reportData = {
      studentName: token.name || "Student",
      studentId: token.sub,
      semester,
      gpa: "3.7",
      cgpa: "3.8",
      generatedAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      grades: [
        {
          id: 1,
          title: "Animation Studies I (WISE-25.1F/CO)",
          code: "WISE-25.1F/CO",
          assignments: "18 / 20",
          courseWork: "26 / 30",
          finalExam: "34 / 40",
          attendance: "10 / 10",
          grade: "A",
          semester: "Semester 01",
        },
        {
          id: 2,
          title: "Drawing and Illustration (WISE-25.1F/CO)",
          code: "WISE-25.1F/CO",
          assignments: "20 / 20",
          courseWork: "22 / 30",
          finalExam: "32 / 40",
          attendance: "08 / 10",
          grade: "B +",
          semester: "Semester 01",
        },
        {
          id: 3,
          title: "Design Principles I (WISE-25.1F/CO)",
          code: "WISE-25.1F/CO",
          assignments: "19 / 20",
          courseWork: "27 / 30",
          finalExam: "38 / 40",
          attendance: "09 / 10",
          grade: "A",
          semester: "Semester 02",
        },
        {
          id: 4,
          title: "Principles of Script Writing (WISE-25.1F/CO)",
          code: "WISE-25.1F/CO",
          assignments: "17 / 20",
          courseWork: "29 / 30",
          finalExam: "35 / 40",
          attendance: "09 / 10",
          grade: "A -",
          semester: "Semester 02",
        },
      ],
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
  } catch (error) {
    console.error("Student Reports API Error:", error);
    return NextResponse.json(
      { message: "Failed to generate report", error: String(error) },
      { status: 500 }
    );
  }
}
