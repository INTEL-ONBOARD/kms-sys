import { NextRequest } from "next/server";
import { requireRole } from "@/lib/core/auth-context";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { connectToDatabase } from "@/lib/db";
import Batch from "@/lib/models/Batch";
import { BadRequestError } from "@/lib/core/errors";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ["super_admin", "admin"]);
    await connectToDatabase();
    
    // Fetch all batches, populating minimal student details
    const batches = await Batch.find()
      .sort({ createdAt: -1 })
      .populate("students", "name email role")
      .lean();
    
    return successResponse({ batches }, undefined, 200);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/batches");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ["super_admin", "admin"]);
    
    const body = await req.json();
    if (!body.name) {
      throw new BadRequestError("Batch name is required");
    }

    await connectToDatabase();
    
    const newBatch = await Batch.create({
      name: body.name,
      description: body.description || "",
      students: body.students || [],
      isActive: body.isActive !== undefined ? body.isActive : true,
      maxCapacity: body.maxCapacity !== undefined ? Number(body.maxCapacity) : 50,
    });
    
    return successResponse({ batch: newBatch }, "Batch created successfully", 201);
  } catch (error) {
    return handleApiError(error, "POST /api/admin/batches");
  }
}
