import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/db";
import Submission from "@/models/Submission";
import { generatePresignedDownloadUrl } from "@/lib/r2";
import mongoose from "mongoose";

/**
 * GET /api/lecturer/submissions/[id]/file?index=0&action=view|download
 * Generates an authenticated pre-signed URL to Cloudflare R2 for student submission files
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const token = await getToken({
      req,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!session?.user && !token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
    }

    await connectToDatabase();

    const submission = await Submission.findById(id).lean();
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const indexParam = searchParams.get("index") || "0";
    const fileIndex = parseInt(indexParam, 10) || 0;
    const action = searchParams.get("action") || "view"; // "view" or "download"
    const rawUrlParam = searchParams.get("url") || "";

    const files = submission.files || [];
    let targetUrl = rawUrlParam;

    if (!targetUrl && files.length > fileIndex) {
      targetUrl = files[fileIndex];
    } else if (!targetUrl && files.length > 0) {
      targetUrl = files[0];
    }

    if (!targetUrl) {
      return NextResponse.json({ error: "No submission file found" }, { status: 404 });
    }

    // If it is an external link (e.g. Google Drive, GitHub), redirect directly
    if (
      targetUrl.startsWith("http") &&
      !targetUrl.includes("cloudflarestorage.com") &&
      !targetUrl.includes("r2.") &&
      !targetUrl.includes("/materials/") &&
      !targetUrl.includes("/courses/")
    ) {
      return NextResponse.redirect(targetUrl, { status: 307 });
    }

    // Extract Cloudflare R2 file key from URL or path
    let fileKey = targetUrl;
    try {
      if (targetUrl.startsWith("http")) {
        const urlObj = new URL(targetUrl);
        fileKey = decodeURIComponent(urlObj.pathname.replace(/^\//, ""));
      }
    } catch {
      fileKey = targetUrl;
    }

    if (!fileKey) {
      return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
    }

    // Extract clean filename
    const parts = fileKey.split("/");
    const lastPart = parts[parts.length - 1] || "submitted_file.pdf";
    const cleanFileName = decodeURIComponent(lastPart).replace(/^\d+-[a-f0-9-]+-/, "").replace(/["\\]/g, "");

    // Guess content type from filename
    let contentType = "application/pdf";
    const lowerName = cleanFileName.toLowerCase();
    if (lowerName.endsWith(".png")) contentType = "image/png";
    else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (lowerName.endsWith(".webp")) contentType = "image/webp";
    else if (lowerName.endsWith(".zip")) contentType = "application/zip";
    else if (lowerName.endsWith(".docx")) contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (lowerName.endsWith(".doc")) contentType = "application/msword";
    else if (lowerName.endsWith(".txt")) contentType = "text/plain";

    const disposition = action === "download"
      ? `attachment; filename="${encodeURIComponent(cleanFileName)}"`
      : `inline; filename="${encodeURIComponent(cleanFileName)}"`;

    // Generate pre-signed URL valid for 1 hour (3600 seconds)
    const signedUrl = await generatePresignedDownloadUrl(fileKey, {
      expiresIn: 3600,
      contentDisposition: disposition,
      contentType,
    });

    if (searchParams.get("json") === "true") {
      return NextResponse.json({ success: true, url: signedUrl });
    }

    return NextResponse.redirect(signedUrl, { status: 307 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load submission file";
    console.error("GET /api/lecturer/submissions/[id]/file error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
