import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Assignment from "@/lib/models/Assignment";
import { generatePresignedDownloadUrl } from "@/lib/r2";
import mongoose from "mongoose";

/**
 * GET /api/student/assignments/[id]/attachment?action=view|download
 * Generates an authenticated pre-signed URL directly to Cloudflare R2
 * with appropriate Content-Disposition (inline for viewing, attachment for download)
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
      return NextResponse.json({ error: "Invalid assignment ID" }, { status: 400 });
    }

    await connectToDatabase();

    const assignment = await Assignment.findById(id).lean();
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (!assignment.attachmentUrl && !assignment.fileKey) {
      return NextResponse.json({ error: "No attachment uploaded for this assignment" }, { status: 404 });
    }

    // Determine storage key
    let fileKey = assignment.fileKey || "";
    if (!fileKey && assignment.attachmentUrl) {
      try {
        const urlObj = new URL(assignment.attachmentUrl);
        fileKey = decodeURIComponent(urlObj.pathname.replace(/^\//, ""));
      } catch {
        fileKey = assignment.attachmentUrl;
      }
    }

    if (!fileKey) {
      return NextResponse.json({ error: "Invalid attachment key" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "download"; // "download" or "view"
    const jsonMode = searchParams.get("json") === "true";

    const cleanFileName = (assignment.attachmentName || assignment.title || "assignment_brief").replace(/["\\]/g, "");
    const disposition = action === "download"
      ? `attachment; filename="${encodeURIComponent(cleanFileName)}"`
      : `inline; filename="${encodeURIComponent(cleanFileName)}"`;

    // Generate pre-signed GET URL valid for 1 hour (3600 seconds)
    const signedUrl = await generatePresignedDownloadUrl(fileKey, {
      expiresIn: 3600,
      contentDisposition: disposition,
      contentType: "application/pdf",
    });

    if (jsonMode) {
      return NextResponse.json({ success: true, url: signedUrl });
    }

    // Redirect directly to the secure pre-signed Cloudflare R2 object
    return NextResponse.redirect(signedUrl, { status: 307 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load assignment attachment";
    console.error("GET /api/student/assignments/[id]/attachment error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
