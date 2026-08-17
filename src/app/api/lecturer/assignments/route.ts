import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import Assignment from "@/models/Assignment";

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

    let query: any = { courseId: { $in: courseIds } };
    if (categoryParam && categoryParam !== "All") {
      query.category = categoryParam;
    }

    const total = await Assignment.countDocuments(query);
    const assignments = await Assignment.find(query)
      .populate("courseId", "title category")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      assignments,
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
    const { title, courseId, dueDate, maxPoints, description, category } = body;

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

    const assignmentDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const assignment = await Assignment.create({
      title,
      description: description || "",
      courseId: targetCourseId,
      dueDate: assignmentDueDate,
      maxPoints: Number(maxPoints) || 100,
      category: category || "Homework",
      status: "open",
    });

    return NextResponse.json(
      { message: "Assignment created successfully", assignment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Lecturer Assignment POST Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
