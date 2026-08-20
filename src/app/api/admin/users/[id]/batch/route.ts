import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { connectToDatabase } from "@/lib/db";
import Batch from "@/models/Batch";
import { NotFoundError, BadRequestError } from "@/server/core/errors";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, ["super_admin", "admin"]);
    await connectToDatabase();
    
    const { id: userId } = await params;
    const body = await req.json();
    
    // batchId can be a string (to assign) or null (to remove from all batches)
    const { batchId } = body;
    
    if (batchId === undefined) {
      throw new BadRequestError("batchId must be provided");
    }

    if (batchId === null) {
      // Always remove the user from any batch they might currently be in
      await Batch.updateMany(
        { students: userId },
        { $pull: { students: userId } }
      );
    } else {
      // First check if the student is already in ANY batch
      const existingBatch = await Batch.findOne({ students: userId });
      if (existingBatch) {
        throw new BadRequestError("This student is already assigned to a batch.");
      }

      // First check if the target batch has reached its maximum capacity
      const targetBatch = await Batch.findById(batchId);
      if (!targetBatch) {
        throw new NotFoundError("Target batch not found");
      }

      if (targetBatch.students.length >= targetBatch.maxCapacity) {
        throw new BadRequestError("Batch capacity reached");
      }

      await Batch.findByIdAndUpdate(
        batchId,
        { $addToSet: { students: userId } }
      );
    }
    
    return successResponse({ message: "User batch assignment updated successfully" }, undefined, 200);
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/users/[userId]/batch");
  }
}
