import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import Assignment from "@/models/Assignment";
import Enrollment from "@/models/Enrollment";
import Notification from "@/models/Notification";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || (token.role !== "lecturer" && token.role !== "super_admin")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const categoryParam = searchParams.get("category");
    const skip = (page - 1) * limit;

    const userId = token.id;
    const userName = token.name || "";

    const courses = await Course.find({
      $or: [
        { instructorId: userId },
        { instructor: { $regex: new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } }
      ]
    }).lean();

    const courseIds = courses.map((c) => c._id);

    let query: any = { 
      courseId: { $in: courseIds },
      category: { $nin: ["Exam", "Final Exam", "Midterm Exam"] }
    };
    if (categoryParam && categoryParam !== "All") {
      query.category = categoryParam;
    }

    const total = await Assignment.countDocuments(query);
    const assignmentsDocs = await Assignment.find(query)
      .populate("courseId", "title category assessmentItems gradingBreakdown")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich assignments with their weight from Course assessmentItems and exclude any exam items
    const assignments = assignmentsDocs
      .filter((a: any) => {
        const course = a.courseId;
        if (course?.assessmentItems && Array.isArray(course.assessmentItems)) {
          const match = course.assessmentItems.find(
            (item: any) => item.name?.toLowerCase() === a.title?.toLowerCase()
          );
          if (match && match.type === "exam") return false;
        }
        return true;
      })
      .map((a: any) => {
        const course = a.courseId;
        let weight: number | null = null;
        if (course?.assessmentItems && Array.isArray(course.assessmentItems)) {
          const match = course.assessmentItems.find(
            (item: any) => item.name?.toLowerCase() === a.title?.toLowerCase()
          );
          if (match) weight = match.weight;
        }
        return {
          ...a,
          weight: weight ?? (a.category === "Project" ? 25 : a.category === "Quiz" ? 10 : 20),
        };
      });

    return NextResponse.json({
      assignments,
      courses: courses.map((c: any) => ({
        _id: c._id,
        title: c.title,
        assessmentItems: (c.assessmentItems || []).filter((i: any) => i.type !== "exam" && i.type !== "attendance"),
      })),
      pagination: { page, limit, total, hasMore: skip + assignments.length < total }
    });
  } catch (error: any) {
    console.error("Lecturer Assignments GET Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || (token.role !== "lecturer" && token.role !== "super_admin")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      title, 
      courseId, 
      dueDate, 
      maxPoints, 
      description, 
      category, 
      weight,
      attachmentUrl,
      attachmentName,
      attachmentSize,
      fileKey
    } = body;

    if (!title) {
      return NextResponse.json({ message: "Assignment title is required" }, { status: 400 });
    }

    await connectToDatabase();

    const userId = token.id;
    const userName = token.name || "";

    let targetCourseId = courseId;
    if (!targetCourseId) {
      const lecturerCourses = await Course.find({
        $or: [
          { instructorId: userId },
          { instructor: { $regex: new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") } }
        ]
      }).lean();

      if (lecturerCourses.length > 0) {
        targetCourseId = lecturerCourses[0]._id;
      } else {
        const anyCourse = await Course.findOne().lean();
        if (anyCourse) {
          targetCourseId = anyCourse._id;
        } else {
          const defaultCourse = await Course.create({
            title: "General Lecture Course",
            instructor: userName || "Lecturer",
            instructorId: userId,
            category: "General",
            price: "Free",
            published: true,
          });
          targetCourseId = defaultCourse._id;
        }
      }
    }

    // Validate that the assignment title exists in Course.assessmentItems
    const courseDoc = await Course.findById(targetCourseId);
    if (courseDoc && courseDoc.assessmentItems && courseDoc.assessmentItems.length > 0) {
      const isExam = courseDoc.assessmentItems.some(
        (i: any) => i.name.trim().toLowerCase() === title.trim().toLowerCase() && i.type === "exam"
      );
      if (isExam) {
        return NextResponse.json(
          { message: `"${title}" is configured as an Exam. Please create it under Exam Manager.` },
          { status: 400 }
        );
      }
    }

    if (!dueDate) {
      return NextResponse.json({ message: "Assignment due date is required" }, { status: 400 });
    }

    const assignmentDueDate = new Date(dueDate);
    if (isNaN(assignmentDueDate.getTime())) {
      return NextResponse.json({ message: "Invalid due date format" }, { status: 400 });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (assignmentDueDate < startOfToday) {
      return NextResponse.json(
        { message: "Assignment due date cannot be in the past. Please select a valid future date." },
        { status: 400 }
      );
    }

    let assignment = await Assignment.findOne({
      courseId: targetCourseId,
      title: { $regex: new RegExp(`^${title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (assignment) {
      assignment.dueDate = assignmentDueDate;
      assignment.maxPoints = Number(maxPoints) || assignment.maxPoints || 100;
      if (description) assignment.description = description;
      if (category) assignment.category = category;
      assignment.attachmentUrl = attachmentUrl || assignment.attachmentUrl || "";
      assignment.attachmentName = attachmentName || assignment.attachmentName || "";
      assignment.attachmentSize = Number(attachmentSize) || assignment.attachmentSize || 0;
      if (fileKey) assignment.fileKey = fileKey;
      assignment.status = "open";
      await assignment.save();
    } else {
      assignment = await Assignment.create({
        title: title.trim(),
        description: description || "",
        courseId: targetCourseId,
        dueDate: assignmentDueDate,
        maxPoints: Number(maxPoints) || 100,
        category: category || "Homework",
        attachmentUrl: attachmentUrl || "",
        attachmentName: attachmentName || "",
        attachmentSize: Number(attachmentSize) || 0,
        fileKey: fileKey || "",
        status: "open",
      });
    }

    // Sync into Course.assessmentItems if not present
    try {
      const courseDoc = await Course.findById(targetCourseId);
      if (courseDoc) {
        const items = courseDoc.assessmentItems || [];
        const exists = items.some((i: any) => i.name.trim().toLowerCase() === title.trim().toLowerCase());
        if (!exists) {
          const itemType = 
            category === "Quiz" 
              ? "quiz" 
              : category === "Project" 
              ? "project" 
              : category === "Lab Report" || category === "Case Study" 
              ? "coursework" 
              : "assignment";

          const assignedWeight = Number(weight) || 15;
          courseDoc.assessmentItems.push({
            name: title.trim(),
            type: itemType,
            weight: assignedWeight,
          });
          await courseDoc.save();
        }
      }
    } catch (syncErr) {
      console.error("Course breakdown sync notice:", syncErr);
    }

    // Notify enrolled students about the new assignment
    const enrollments = await Enrollment.find({ courseId: targetCourseId }).lean();
    if (enrollments.length > 0) {
      const course = await Course.findById(targetCourseId).lean();
      const courseTitle = course?.title || "Course";
      const notifications = enrollments.map((e) => ({
        userId: e.userId,
        type: "assignment",
        message: `New Assignment: "${title}" in ${courseTitle} (Due: ${assignmentDueDate.toLocaleDateString()})`,
        link: "/assignments",
      }));
      await Notification.insertMany(notifications);
    }

    return NextResponse.json(
      { message: "Assignment created and synced to Course Breakdown successfully", assignment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Lecturer Assignment POST Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
