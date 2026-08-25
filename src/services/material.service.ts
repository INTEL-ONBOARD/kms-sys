import crypto from "crypto";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import CourseMaterial from "@/lib/models/CourseMaterial";
import Course from "@/lib/models/Course";
import Enrollment from "@/lib/models/Enrollment";
import { generatePresignedUploadUrl, generatePresignedDownloadUrl, getFilePublicUrl } from "@/lib/r2";
import { BadRequestError, NotFoundError, ForbiddenError } from "@/lib/core/errors";
import { CreateMaterialInput, GenerateUploadUrlInput } from "@/types/dtos/material.dto";

type MaterialTypeEnum = "notes" | "slides" | "tutorial" | "assignment" | "video" | "other";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  "video/mp4",
  "audio/mpeg",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_STUDENT_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_LECTURER_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * Generates an authenticated pre-signed Cloudflare R2 / S3 upload URL.
 */
export async function generateUploadUrl(
  input: GenerateUploadUrlInput,
  user?: { id: string; role: string; name?: string }
) {
  if (!ALLOWED_MIME_TYPES.has(input.fileType.toLowerCase())) {
    throw new BadRequestError(
      `File type '${input.fileType}' is not supported. Please upload PDF, PPT, DOC, ZIP, or media files.`
    );
  }

  const isStudent = user?.role === "student";
  const maxAllowedSize = isStudent ? MAX_STUDENT_FILE_SIZE : MAX_LECTURER_FILE_SIZE;
  const maxAllowedLabel = isStudent ? "10MB for students" : "50MB for lecturers";

  if (input.fileSize && input.fileSize > maxAllowedSize) {
    throw new BadRequestError(`File exceeds maximum allowed size of ${maxAllowedLabel}.`);
  }

  if (user?.role === "lecturer") {
    await connectToDatabase();
    const course = await Course.findById(input.courseId).lean();
    if (!course) {
      throw new NotFoundError("Course not found");
    }
    const isAssigned =
      course.instructorId?.toString() === user.id ||
      (user.name && course.instructor?.toLowerCase() === user.name.toLowerCase());
    if (!isAssigned) {
      throw new ForbiddenError("You are not assigned to this course. File upload is blocked.");
    }
  }

  const sanitizedOriginalName = input.fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_");
  const uniqueId = crypto.randomUUID();
  const fileKey = `courses/${input.courseId}/materials/${Date.now()}-${uniqueId}-${sanitizedOriginalName}`;

  const uploadUrl = await generatePresignedUploadUrl(fileKey, input.fileType, 900);
  const publicUrl = getFilePublicUrl(fileKey);

  return {
    success: true,
    uploadUrl,
    fileKey,
    publicUrl,
    expiresIn: 900,
  };
}

/**
 * Creates course material metadata record in the database.
 */
export async function createMaterial(input: CreateMaterialInput, userId: string) {
  await connectToDatabase();

  const course = await Course.findById(input.courseId).lean();
  if (!course) {
    throw new NotFoundError("Course not found");
  }

  const newMaterial = await CourseMaterial.create({
    courseId: new mongoose.Types.ObjectId(input.courseId),
    title: input.title,
    description: input.description || "",
    fileKey: input.fileKey,
    fileName: input.fileName,
    fileUrl: `https://${process.env.R2_BUCKET_NAME || "kms-bucket"}.r2.cloudflarestorage.com/${input.fileKey}`,
    fileSize: input.fileSize || 0,
    materialType: (["notes", "slides", "tutorial", "assignment", "video", "other"].includes(input.fileType || "")
      ? (input.fileType as MaterialTypeEnum)
      : "notes"),
    mimeType: input.mimeType || "application/octet-stream",
    lecturerId: new mongoose.Types.ObjectId(userId),
    isPublished: input.isPublished ?? true,
  });

  return newMaterial;
}

/**
 * Retrieves materials for a course or all materials.
 */
export async function getMaterials(courseId?: string, isStudent = false) {
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (courseId) query.courseId = new mongoose.Types.ObjectId(courseId);
  if (isStudent) query.isPublished = true;

  const materials = await CourseMaterial.find(query)
    .populate("courseId", "title published")
    .sort({ createdAt: -1 })
    .lean();

  if (isStudent) {
    return {
      materials: materials.filter((m: any) => m.courseId && m.courseId.published !== false),
    };
  }

  return { materials };
}

/**
 * Deletes a material by ID.
 */
export async function deleteMaterial(id: string) {
  await connectToDatabase();
  const deleted = await CourseMaterial.findByIdAndDelete(id);
  if (!deleted) {
    throw new NotFoundError("Material not found to delete");
  }
  return { id };
}

/**
 * Generates an authenticated pre-signed download URL with enrollment check.
 */
export async function getMaterialFileUrl(
  materialId: string,
  user: { id: string; role: string },
  action: "view" | "download" = "view"
) {
  await connectToDatabase();

  const material = await CourseMaterial.findById(materialId).lean();
  if (!material) {
    throw new NotFoundError("Material not found");
  }

  // Student enrollment check
  if (user.role === "student") {
    const userObjectId = mongoose.Types.ObjectId.isValid(user.id)
      ? new mongoose.Types.ObjectId(user.id)
      : user.id;

    const isEnrolled = await Enrollment.exists({
      courseId: material.courseId,
      $or: [{ userId: userObjectId }, { userId: user.id }],
    });

    if (!isEnrolled) {
      throw new ForbiddenError("Access denied: You are not enrolled in this course");
    }

    const course = await Course.findById(material.courseId).select("published").lean();
    if (!course || course.published === false || material.isPublished === false) {
      throw new ForbiddenError(
        "Access denied: Learning materials are currently not visible for this course"
      );
    }
  }

  // Local storage or external link bypasses R2 signed URL
  if (
    material.fileUrl &&
    (material.fileUrl.startsWith("/uploads/") ||
      ((material.fileUrl.startsWith("http://") || material.fileUrl.startsWith("https://")) &&
        (material.fileKey?.startsWith("external-link") || material.materialType === "video")))
  ) {
    return { signedUrl: material.fileUrl, material };
  }

  const cleanFileName = (material.fileName || "material").replace(/["\\]/g, "");
  const disposition =
    action === "download"
      ? `attachment; filename="${encodeURIComponent(cleanFileName)}"`
      : `inline; filename="${encodeURIComponent(cleanFileName)}"`;

  try {
    const signedUrl = await generatePresignedDownloadUrl(material.fileKey, {
      expiresIn: 3600,
      contentDisposition: disposition,
      contentType: material.mimeType || "application/pdf",
    });
    return { signedUrl, material };
  } catch (err) {
    // If R2 signed URL fails, fallback to direct fileUrl
    return { signedUrl: material.fileUrl || `/api/materials`, material };
  }
}
