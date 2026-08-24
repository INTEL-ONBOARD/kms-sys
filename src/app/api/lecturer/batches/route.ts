import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { connectToDatabase } from "@/lib/db";
import Batch from "@/models/Batch";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["lecturer", "super_admin", "admin"]);
    await connectToDatabase();
    
    // Fetch active batches (id and name) to populate the filter dropdown
    const batches = await Batch.find({ isActive: true })
      .select("name _id")
      .sort({ name: 1 })
      .lean();
    
    return successResponse({ batches }, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/lecturer/batches");
  }
}
