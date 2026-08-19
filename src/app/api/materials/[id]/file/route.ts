import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import CourseMaterial from "@/models/CourseMaterial";
import Enrollment from "@/models/Enrollment";
import { generatePresignedDownloadUrl } from "@/lib/r2";
import mongoose from "mongoose";

/**
 * GET /api/materials/[id]/file?action=view|download
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
      return NextResponse.json({ error: "Invalid material ID" }, { status: 400 });
    }

    await connectToDatabase();

    const material = await CourseMaterial.findById(id).lean();
    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const role = (session?.user as { role?: string })?.role || (token?.role as string);

    // If student, check if they are enrolled in the material's course
    if (role === "student") {
      const userId = (session?.user as any)?.id || (session?.user as any)?._id || token?.id || token?.sub;
      const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

      const isEnrolled = await Enrollment.exists({
        courseId: material.courseId,
        $or: [{ userId: userObjectId }, { userId: userId }],
      });

      if (!isEnrolled) {
        return NextResponse.json(
          { error: "Access denied: You are not enrolled in this course" },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "view"; // "view" or "download"
    const jsonMode = searchParams.get("json") === "true";

    const cleanFileName = (material.fileName || "material").replace(/["\\]/g, "");
    const disposition = action === "download"
      ? `attachment; filename="${encodeURIComponent(cleanFileName)}"`
      : `inline; filename="${encodeURIComponent(cleanFileName)}"`;

    // Generate pre-signed URL valid for 1 hour (3600 seconds)
    const signedUrl = await generatePresignedDownloadUrl(material.fileKey, {
      expiresIn: 3600,
      contentDisposition: disposition,
      contentType: material.mimeType || "application/pdf",
    });

    if (jsonMode) {
      return NextResponse.json({ success: true, url: signedUrl });
    }

    // Redirect directly to the secure pre-signed Cloudflare R2 object
    return NextResponse.redirect(signedUrl, { status: 307 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load material file";
    console.error("GET /api/materials/[id]/file error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
