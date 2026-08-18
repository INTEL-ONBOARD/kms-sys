import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import CourseMaterial from "@/models/CourseMaterial";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import { deleteR2Object } from "@/lib/r2";
import mongoose from "mongoose";

/**
 * GET /api/materials?courseId=xyz
 * Fetch course materials for a given course (accessible by students, lecturers, and admins)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!session?.user && !token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session?.user as { role?: string })?.role || (token?.role as string);

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
      }
      query.courseId = new mongoose.Types.ObjectId(courseId);
    }

    // Students can ONLY see materials for courses they are enrolled in by Admin
    if (role === "student") {
      const userId = (session?.user as any)?.id || (session?.user as any)?._id || token?.id || token?.sub;
      const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

      const enrollments = await Enrollment.find({
        $or: [{ userId: userObjectId }, { userId: userId }]
      }).lean();

      const enrolledCourseIds = enrollments.map((e: any) => e.courseId?.toString()).filter(Boolean);

      if (courseId) {
        const isEnrolled = enrolledCourseIds.includes(courseId.toString());
        if (!isEnrolled) {
          return NextResponse.json({ error: "Access denied: You are not enrolled in this course" }, { status: 403 });
        }
      } else {
        query.courseId = { $in: enrolledCourseIds.map((id) => new mongoose.Types.ObjectId(id)) };
      }

      query.isPublished = true;
    }

    const materials = await CourseMaterial.find(query)
      .populate("lecturerId", "name email")
      .populate("courseId", "title category")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: materials });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch materials";
    console.error("GET /api/materials error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/materials
 * Save metadata after browser finishes direct upload to Cloudflare R2
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id?: string; _id?: string; role?: string; email?: string };
    if (user.role !== "lecturer" && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Lecturer access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      courseId,
      materialType,
      fileName,
      fileKey,
      fileUrl,
      fileSize,
      mimeType,
    } = body;

    // Validate required fields
    if (!title || !courseId || !fileName || !fileKey || !fileUrl || !fileSize || !mimeType) {
      return NextResponse.json(
        { error: "Missing required material metadata" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    await connectToDatabase();

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const lecturerId = user.id || user._id;

    // Persist document metadata
    const material = await CourseMaterial.create({
      title: title.trim(),
      description: description?.trim() || "",
      courseId: new mongoose.Types.ObjectId(courseId),
      lecturerId: lecturerId ? new mongoose.Types.ObjectId(lecturerId) : undefined,
      materialType: materialType || "notes",
      fileName,
      fileKey,
      fileUrl,
      fileSize,
      mimeType,
      isPublished: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Course material metadata saved successfully",
        data: material,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save material";
    console.error("POST /api/materials error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/materials?id=xyz
 * Remove material record from database and delete underlying R2 object
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid material ID required" }, { status: 400 });
    }

    await connectToDatabase();

    const material = await CourseMaterial.findById(id);
    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // Delete object from Cloudflare R2
    if (material.fileKey) {
      try {
        await deleteR2Object(material.fileKey);
      } catch (r2Err) {
        console.warn("Warning: Could not delete R2 object key:", material.fileKey, r2Err);
      }
    }

    // Remove DB document
    await CourseMaterial.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete material";
    console.error("DELETE /api/materials error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
