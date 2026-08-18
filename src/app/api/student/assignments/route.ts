import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import Assignment from "@/models/Assignment";
import Submission from "@/models/Submission";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || (!token.id && !token.sub)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (token.role !== "student" && token.role !== "super_admin") {
      return NextResponse.json({ message: "Forbidden: Student access required" }, { status: 403 });
    }

    const userId = (token.id || token.sub) as string;

    await connectToDatabase();

    // 1. Get all courses the student is enrolled in
    const activeCourses = await Course.find({
      $or: [
        { published: true },
        { status: "active" },
        { status: "published" },
        { status: { $exists: false } },
      ],
    }).lean();

    const allCourses = activeCourses.length > 0 ? activeCourses : await Course.find().lean();
    const currentEnrollments = await Enrollment.find({ userId }).lean();
    const enrolledCourseIds = new Set(currentEnrollments.map((e: any) => e.courseId?.toString()).filter(Boolean));

    // Auto-enroll if missing
    for (const pCourse of allCourses) {
      if (!enrolledCourseIds.has(pCourse._id.toString())) {
        try {
          await Enrollment.create({
            userId,
            courseId: pCourse._id,
            progress: 0,
          });
          enrolledCourseIds.add(pCourse._id.toString());
        } catch (e) {
          // ignore duplicate
        }
      }
    }

    const courseIds = Array.from(enrolledCourseIds);

    // 2. Fetch all assignments for enrolled courses
    const assignments = await Assignment.find({ courseId: { $in: courseIds } })
      .populate({
        path: "courseId",
        select: "title category instructor",
        model: Course,
      })
      .sort({ dueDate: 1 })
      .lean();

    const assignmentIds = assignments.map((a) => a._id);

    // 3. Fetch any existing submissions from this student for these assignments
    const submissions = await Submission.find({
      studentId: userId,
      assignmentId: { $in: assignmentIds },
    }).lean();

    const submissionMap = new Map();
    submissions.forEach((s: any) => {
      submissionMap.set(s.assignmentId.toString(), s);
    });

    const now = new Date();

    // 4. Format assignments with submission status and urgency
    const formattedAssignments = assignments.map((a: any) => {
      const sub = submissionMap.get(a._id.toString());
      const due = a.dueDate ? new Date(a.dueDate) : new Date();
      const diffMs = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isOverdue = diffMs < 0;

      let state = "Pending";
      if (sub) {
        if (sub.grade !== null && sub.grade !== undefined) {
          state = "Graded";
        } else {
          state = "Submitted";
        }
      } else if (isOverdue) {
        state = "Overdue";
      }

      let timeLeft = "";
      if (isOverdue) {
        const absDays = Math.abs(diffDays);
        timeLeft = absDays === 0 ? "Overdue today" : `Overdue by ${absDays} day${absDays > 1 ? "s" : ""}`;
      } else if (diffDays === 0) {
        timeLeft = "Due Today";
      } else if (diffDays === 1) {
        timeLeft = "1 Day Left";
      } else if (diffDays < 7) {
        timeLeft = `${diffDays} Days Left`;
      } else {
        const weeks = Math.ceil(diffDays / 7);
        timeLeft = `${weeks} Week${weeks > 1 ? "s" : ""} Left`;
      }

      const isUrgent = !sub && diffDays <= 3 && diffDays >= 0;

      return {
        _id: a._id.toString(),
        title: a.title || "Untitled Assignment",
        description: a.description || "",
        course: a.courseId?.title || "General Course",
        courseId: a.courseId?._id?.toString() || "",
        courseCategory: a.courseId?.category || "General",
        instructor: a.courseId?.instructor || "Module Lecturer",
        issuedDate: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
        issuedDateFormatted: a.createdAt 
          ? new Date(a.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          : "Recently Issued",
        dueDate: due.toISOString(),
        dueDateFormatted: due.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        maxPoints: a.maxPoints || 100,
        category: a.category || "Homework",
        isOverdue,
        isUrgent,
        timeLeft,
        status: state,
        submission: sub
          ? {
              _id: sub._id.toString(),
              content: sub.content || "",
              files: sub.files || [],
              submittedAt: sub.submittedAt,
              grade: sub.grade,
              feedback: sub.feedback || "",
              status: sub.status || "submitted",
            }
          : null,
      };
    });

    return NextResponse.json({ assignments: formattedAssignments, total: formattedAssignments.length }, { status: 200 });
  } catch (error: any) {
    console.error("Student Assignments GET API Error:", error);
    return NextResponse.json({ message: "Failed to fetch assignments", error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || (!token.id && !token.sub)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (token.id || token.sub) as string;
    const body = await req.json();
    const { assignmentId, content, files } = body;

    if (!assignmentId) {
      return NextResponse.json({ message: "Missing assignmentId" }, { status: 400 });
    }

    await connectToDatabase();

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
    }

    const now = new Date();
    const isLate = assignment.dueDate && new Date(assignment.dueDate).getTime() < now.getTime();

    // Check if previous submission exists
    const existingSubmission = await Submission.findOne({
      assignmentId,
      studentId: userId,
    });

    let submission;
    if (existingSubmission) {
      existingSubmission.content = content || existingSubmission.content;
      if (files && files.length > 0) existingSubmission.files = files;
      existingSubmission.submittedAt = now;
      existingSubmission.status = isLate ? "late" : "submitted";
      submission = await existingSubmission.save();
    } else {
      submission = await Submission.create({
        assignmentId,
        studentId: userId,
        courseId: assignment.courseId,
        content: content || "",
        files: files || [],
        submittedAt: now,
        status: isLate ? "late" : "submitted",
      });

      // Increment submissions count
      await Assignment.findByIdAndUpdate(assignmentId, { $inc: { submissionsCount: 1 } });
    }

    return NextResponse.json(
      { message: isLate ? "Late assignment submitted successfully" : "Assignment submitted successfully!", submission },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Student Assignment Submit Error:", error);
    return NextResponse.json({ message: "Failed to submit assignment", error: error.message }, { status: 500 });
  }
}
