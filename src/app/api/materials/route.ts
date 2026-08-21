import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { BadRequestError, NotFoundError, ForbiddenError } from "@/server/core/errors";
import { deleteR2Object } from "@/lib/r2";
import { connectToDatabase } from "@/lib/db";
import CourseMaterial from "@/models/CourseMaterial";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import mongoose from "mongoose";

// Ensure models are registered
Course;
CourseMaterial;
Enrollment;
User;

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new BadRequestError("Invalid courseId");
      }
      query.courseId = new mongoose.Types.ObjectId(courseId);
    }

    if (authUser.role === "student") {
      const userObjectId = mongoose.Types.ObjectId.isValid(authUser.id)
        ? new mongoose.Types.ObjectId(authUser.id)
        : authUser.id;

      const enrollments = await Enrollment.find({
        $or: [{ userId: userObjectId }, { userId: authUser.id }],
      }).lean();

      const enrolledCourseIds = enrollments
        .map((e: any) => e.courseId?.toString())
        .filter(Boolean);

      if (courseId) {
        if (!enrolledCourseIds.includes(courseId.toString())) {
          return successResponse(
            undefined,
            "Access denied: You are not enrolled in this course",
            403
          );
        }
      } else {
        query.courseId = {
          $in: enrolledCourseIds.map((id) => new mongoose.Types.ObjectId(id)),
        };
      }

      query.isPublished = true;
    } else if (authUser.role === "lecturer") {
      const lecturerCourses = await Course.find({
        $or: [
          { instructorId: authUser.id },
          ...(authUser.name ? [{ instructor: { $regex: new RegExp(`^${authUser.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } }] : []),
        ],
      }).lean();
      const lecturerCourseIds = lecturerCourses.map((c) => c._id);

      if (lecturerCourseIds.length === 0) {
        return successResponse([], undefined, 200, {
          success: true,
          data: [],
          materials: [],
        });
      }

      if (courseId) {
        if (!lecturerCourseIds.map(String).includes(courseId.toString())) {
          return successResponse([], undefined, 200, {
            success: true,
            data: [],
            materials: [],
          });
        }
      } else {
        query.courseId = { $in: lecturerCourseIds };
      }
    }

    const materials = await CourseMaterial.find(query)
      .populate({ path: "lecturerId", model: User, select: "name email" })
      .populate({ path: "courseId", model: Course, select: "title category" })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(materials, undefined, 200, {
      success: true,
      data: materials,
      materials,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/materials");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
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

    if (!title || !courseId || !fileName || !fileKey || !fileUrl || !fileSize || !mimeType) {
      throw new BadRequestError("Missing required material metadata");
    }

    if (fileSize > 50 * 1024 * 1024) {
      throw new BadRequestError("File exceeds maximum allowed lecturer upload limit of 50MB");
    }

    await connectToDatabase();

    const course = await Course.findById(courseId);
    if (!course) {
      throw new NotFoundError("Course not found");
    }

    // If lecturer, verify they are assigned to this course
    if (authUser.role === "lecturer") {
      const isAssigned =
        course.instructorId?.toString() === authUser.id ||
        (authUser.name && course.instructor?.toLowerCase() === authUser.name.toLowerCase());
      if (!isAssigned) {
        throw new ForbiddenError("You are not assigned to this course. Material upload is blocked.");
      }
    }

    const material = await CourseMaterial.create({
      title: title.trim(),
      description: description?.trim() || "",
      courseId: new mongoose.Types.ObjectId(courseId),
      lecturerId: new mongoose.Types.ObjectId(authUser.id),
      materialType: materialType || "notes",
      fileName,
      fileKey,
      fileUrl,
      fileSize,
      mimeType,
      isPublished: true,
    });

    return successResponse(
      material,
      "Course material metadata saved successfully",
      201,
      { success: true, data: material }
    );
  } catch (error) {
    return handleApiError(error, "POST /api/materials");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Valid material ID required");
    }

    await connectToDatabase();

    const material = await CourseMaterial.findById(id);
    if (!material) {
      throw new NotFoundError("Material not found");
    }

    if (authUser.role === "lecturer") {
      const isOwner = material.lecturerId?.toString() === authUser.id;
      if (!isOwner) {
        const course = await Course.findById(material.courseId).lean();
        const isAssigned =
          course &&
          (course.instructorId?.toString() === authUser.id ||
            (authUser.name && course.instructor?.toLowerCase() === authUser.name.toLowerCase()));
        if (!isAssigned) {
          throw new ForbiddenError("You are not authorized to delete this course material.");
        }
      }
    }

    if (material.fileKey) {
      try {
        await deleteR2Object(material.fileKey);
      } catch (r2Err) {
        console.warn("Warning: Could not delete R2 object key:", material.fileKey, r2Err);
      }
    }

    await CourseMaterial.findByIdAndDelete(id);

    return successResponse(undefined, "Material deleted successfully", 200, {
      success: true,
    });
  } catch (error) {
    return handleApiError(error, "DELETE /api/materials");
  }
}
