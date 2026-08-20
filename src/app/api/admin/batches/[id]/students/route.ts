import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { connectToDatabase } from "@/lib/db";
import Batch from "@/models/Batch";
import { NotFoundError } from "@/server/core/errors";
// We need to import User to ensure the model is registered before population
import "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ["super_admin", "admin"]);
    await connectToDatabase();

    const { id: batchId } = await params;
    const search = req.nextUrl.searchParams.get("search");

    const matchCondition = search ? {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    } : undefined;

    const batch = await Batch.findById(batchId)
      .populate({
        path: "students",
        select: "name email role",
        match: matchCondition
      })
      .lean();

    if (!batch) {
      throw new NotFoundError("Batch not found");
    }

    return successResponse({ students: batch.students }, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/batches/[batchId]/students");
  }
}
