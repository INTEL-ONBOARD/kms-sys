import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generatePresignedUploadUrl, getFilePublicUrl } from "@/lib/r2";
import crypto from "crypto";

// Allowed MIME types for course materials
const ALLOWED_MIME_TYPES = new Set([
  // Documents
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
  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
  // Media
  "video/mp4",
  "audio/mpeg",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "lecturer" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Lecturer access required" }, { status: 403 });
    }

    const body = await req.json();
    const { fileName, fileType, fileSize, courseId } = body;

    if (!fileName || !fileType || !courseId) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileType, courseId" },
        { status: 400 }
      );
    }

    // MIME type validation
    if (!ALLOWED_MIME_TYPES.has(fileType.toLowerCase())) {
      return NextResponse.json(
        { error: `File type '${fileType}' is not supported. Please upload PDF, PPT, DOC, ZIP, or media files.` },
        { status: 400 }
      );
    }

    // File size validation (if provided by client)
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds maximum allowed size of 250MB.` },
        { status: 400 }
      );
    }

    // Clean and sanitize file name
    const sanitizedOriginalName = fileName
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/_{2,}/g, "_");
    const uniqueId = crypto.randomUUID();
    const fileKey = `courses/${courseId}/materials/${Date.now()}-${uniqueId}-${sanitizedOriginalName}`;

    // Generate pre-signed PUT URL with 15-minute validity (900s)
    const uploadUrl = await generatePresignedUploadUrl(fileKey, fileType, 900);
    const publicUrl = getFilePublicUrl(fileKey);

    return NextResponse.json({
      success: true,
      uploadUrl,
      fileKey,
      publicUrl,
      expiresIn: 900,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate pre-signed upload URL";
    console.error("Error generating pre-signed upload URL:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
