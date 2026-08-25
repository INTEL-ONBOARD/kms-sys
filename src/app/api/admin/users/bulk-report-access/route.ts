import { NextRequest } from "next/server";
import { requireRole } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { connectToDatabase } from "@/lib/db";
import Batch from "@/models/Batch";
import User from "@/models/User";

export async function PUT(req: NextRequest) {
  try {
    await requireRole(req, ["super_admin", "admin"]);
    const { batchId, accessStatus } = await req.json();

    if (!batchId || !accessStatus) {
      throw new Error("Missing batchId or accessStatus");
    }

    const reportApproved = accessStatus === 'Approved';

    await connectToDatabase();
    
    // Find the batch and its students
    const batch = await Batch.findById(batchId).lean();
    if (!batch) {
      throw new Error("Batch not found");
    }

    if (!batch.students || batch.students.length === 0) {
      return successResponse({ matchedCount: 0, modifiedCount: 0, message: "No students in this batch" }, undefined, 200);
    }

    // Update users who are in the batch and have role 'student'
    const result = await User.updateMany(
      { 
        _id: { $in: batch.students },
        role: "student"
      },
      {
        $set: { reportApproved }
      }
    );

    return successResponse({ 
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      message: `Successfully updated report access for ${result.modifiedCount} students.` 
    }, undefined, 200);

  } catch (error) {
    return handleApiError(error, "PUT /api/admin/users/bulk-report-access");
  }
}
