import { NextRequest } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { connectToDatabase } from "@/lib/db";
import Batch from "@/lib/models/Batch";
import { BadRequestError, NotFoundError } from "@/lib/core/errors";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await requireRole(req, ["super_admin", "admin"]);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid batch ID format");
    }

    await connectToDatabase();
    
    const batch = await Batch.findById(id)
      .populate("students", "name email role")
      .lean();
      
    if (!batch) {
      throw new NotFoundError("Batch not found");
    }
    
    return successResponse({ batch }, undefined, 200);
  } catch (error) {
    return handleApiError(error, `GET /api/admin/batches/${id}`);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await requireRole(req, ["super_admin", "admin"]);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid batch ID format");
    }

    const body = await req.json();
    await connectToDatabase();
    
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.students !== undefined) updateData.students = body.students;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.maxCapacity !== undefined) updateData.maxCapacity = Number(body.maxCapacity);

    const updatedBatch = await Batch.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("students", "name email role")
      .lean();

    if (!updatedBatch) {
      throw new NotFoundError("Batch not found");
    }
    
    return successResponse({ batch: updatedBatch }, "Batch updated successfully", 200);
  } catch (error) {
    return handleApiError(error, `PUT /api/admin/batches/${id}`);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await requireRole(req, ["super_admin", "admin"]);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError("Invalid batch ID format");
    }

    await connectToDatabase();
    
    const deletedBatch = await Batch.findByIdAndDelete(id);
    
    if (!deletedBatch) {
      throw new NotFoundError("Batch not found");
    }
    
    return successResponse({ id }, "Batch deleted successfully", 200);
  } catch (error) {
    return handleApiError(error, `DELETE /api/admin/batches/${id}`);
  }
}
