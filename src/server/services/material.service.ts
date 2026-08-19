import crypto from "crypto";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import CourseMaterial from "@/models/CourseMaterial";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import { generatePresignedUploadUrl, generatePresignedDownloadUrl, getFilePublicUrl } from "@/lib/r2";
import { BadRequestError, NotFoundError, ForbiddenError } from "../core/errors";
import { CreateMaterialInput, GenerateUploadUrlInput } from "../dtos/material.dto";

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

const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250 MB

/**
 * Generates an authenticated pre-signed Cloudflare R2 / S3 upload URL.
 */
export async function generateUploadUrl(input: GenerateUploadUrlInput) {
  if (!ALLOWED_MIME_TYPES.has(input.fileType.toLowerCase())) {
    throw new BadRequestError(
      `File type '${input.fileType}' is not supported. Please upload PDF, PPT, DOC, ZIP, or media files.`
    );
  }

  if (input.fileSize && input.fileSize > MAX_FILE_SIZE) {
    throw new BadRequestError("File exceeds maximum allowed size of 250MB.");
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
      ? input.fileType
      : "notes") as any,
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

  const query: Record<string, any> = {};
  if (courseId) query.courseId = courseId;
  if (isStudent) query.isPublished = true;

  const materials = await CourseMaterial.find(query)
    .populate("courseId", "title")
    .sort({ createdAt: -1 })
    .lean();

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
  }

  const cleanFileName = (material.fileName || "material").replace(/["\\]/g, "");
  const disposition =
    action === "download"
      ? `attachment; filename="${encodeURIComponent(cleanFileName)}"`
      : `inline; filename="${encodeURIComponent(cleanFileName)}"`;

  const signedUrl = await generatePresignedDownloadUrl(material.fileKey, {
    expiresIn: 3600,
    contentDisposition: disposition,
    contentType: material.mimeType || "application/pdf",
  });

  return { signedUrl, material };
}
