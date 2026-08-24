import { NextRequest } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { connectToDatabase } from "@/lib/db";
import Batch from "@/lib/models/Batch";
import { NotFoundError, BadRequestError } from "@/lib/core/errors";

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

    if (!batchId || batchId === "none") {
      // Remove the user from any batch they might currently be in
      await Batch.updateMany(
        { students: userId },
        { $pull: { students: userId } }
      );
      return successResponse({ message: "User removed from batch successfully" }, undefined, 200);
    }

    // Check if target batch exists
    const targetBatch = await Batch.findById(batchId);
    if (!targetBatch) {
      throw new NotFoundError("Target batch not found");
    }

    const isAlreadyInTargetBatch = targetBatch.students.some(
      (s) => s.toString() === userId
    );

    if (isAlreadyInTargetBatch) {
      // Ensure student is cleanly removed from any other batches if orphaned
      await Batch.updateMany(
        { _id: { $ne: batchId }, students: userId },
        { $pull: { students: userId } }
      );
      return successResponse({ message: "Student is already in this batch" }, undefined, 200);
    }

    // Check if target batch has reached its maximum capacity
    if (targetBatch.students.length >= targetBatch.maxCapacity) {
      throw new BadRequestError("Batch capacity reached");
    }

    // Remove user from any other batch they might currently be in (seamless reassignment)
    await Batch.updateMany(
      { students: userId },
      { $pull: { students: userId } }
    );

    // Add user to the target batch
    await Batch.findByIdAndUpdate(
      batchId,
      { $addToSet: { students: userId } }
    );
    
    return successResponse({ message: "User batch assignment updated successfully" }, undefined, 200);
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/users/[userId]/batch");
  }
}
