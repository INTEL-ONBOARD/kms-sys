import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { BadRequestError } from "@/server/core/errors";
import * as MaterialService from "@/server/services/material.service";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth(req);
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid material ID");
    }

    const { searchParams } = new URL(req.url);
    const action = (searchParams.get("action") as "view" | "download") || "view";
    const jsonMode = searchParams.get("json") === "true";

    const { signedUrl } = await MaterialService.getMaterialFileUrl(
      id,
      authUser,
      action
    );

    if (jsonMode) {
      return successResponse({ url: signedUrl }, undefined, 200, { success: true });
    }

    return NextResponse.redirect(signedUrl, { status: 307 });
  } catch (error) {
    return handleApiError(error, "GET /api/materials/[id]/file");
  }
}
