import { NextRequest } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { BadRequestError, NotFoundError, ForbiddenError } from "@/lib/core/errors";
import { connectToDatabase } from "@/lib/db";
import CourseMaterial from "@/lib/models/CourseMaterial";
import Course from "@/lib/models/Course";
import { uploadBufferToR2, getFilePublicUrl } from "@/lib/r2";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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
  "application/octet-stream",
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireRole(req, ["lecturer", "super_admin", "admin"]);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const courseId = formData.get("courseId") as string | null;
    const title = formData.get("title") as string | null;
    const description = (formData.get("description") as string | null) || "";
    const materialType = (formData.get("materialType") as string | null) || "notes";

    if (!courseId || !title?.trim()) {
      throw new BadRequestError("Target course and title are required.");
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new BadRequestError("Invalid courseId format.");
    }

    await connectToDatabase();

    const course = await Course.findById(courseId).lean();
    if (!course) {
      throw new NotFoundError("Course not found.");
    }

    if (authUser.role === "lecturer") {
      const isAssigned =
        course.instructorId?.toString() === authUser.id ||
        (authUser.name && course.instructor?.toLowerCase() === authUser.name.toLowerCase());
      if (!isAssigned) {
        throw new ForbiddenError("You are not assigned to this course. Upload is blocked.");
      }
    }

    if (!file) {
      throw new BadRequestError("Please select a file to upload.");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestError("File exceeds the maximum limit of 50MB.");
    }

    const mimeType = file.type || "application/octet-stream";
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      throw new BadRequestError(`File format '${file.type}' is not supported.`);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedOriginalName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/_{2,}/g, "_");
    const uniqueId = crypto.randomUUID();
    const fileKey = `courses/${courseId}/materials/${Date.now()}-${uniqueId}-${sanitizedOriginalName}`;

    let fileUrl = "";

    // Attempt cloud R2 upload first
    try {
      await uploadBufferToR2(fileKey, buffer, mimeType);
      fileUrl = getFilePublicUrl(fileKey);
    } catch (r2Error) {
      console.warn("R2 upload error, falling back to local storage:", r2Error);
      
      // Local storage fallback for dev or when R2 is unavailable
      const uploadDir = path.join(process.cwd(), "public", "uploads", "materials");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const localFileName = `${Date.now()}-${uniqueId}-${sanitizedOriginalName}`;
      const localFilePath = path.join(uploadDir, localFileName);
      fs.writeFileSync(localFilePath, buffer);
      fileUrl = `/uploads/materials/${localFileName}`;
    }

    const material = await CourseMaterial.create({
      title: title.trim(),
      description: description.trim(),
      courseId: new mongoose.Types.ObjectId(courseId),
      lecturerId: new mongoose.Types.ObjectId(authUser.id),
      materialType: (["notes", "slides", "tutorial", "assignment", "video", "other"].includes(materialType)
        ? materialType
        : "notes") as any,
      fileName: file.name,
      fileKey,
      fileUrl,
      fileSize: file.size,
      mimeType,
      isPublished: true,
    });

    return successResponse(
      material,
      "Material uploaded and published successfully",
      201,
      { success: true, data: material }
    );
  } catch (error) {
    return handleApiError(error, "POST /api/materials/upload");
  }
}
