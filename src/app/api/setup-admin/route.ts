import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { BadRequestError } from "@/server/core/errors";

export async function GET() {
  try {
    await connectToDatabase();

    const adminExists = await User.findOne({ role: "super_admin" });
    if (adminExists) {
      throw new BadRequestError("Super Admin account already exists!");
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("Admin@2026", salt);

    const superAdmin = await User.create({
      name: "System Admin",
      email: "admin@wiseeast.edu",
      password: hashedPassword,
      role: "super_admin",
      status: "active",
      isActivated: true,
    });

    return successResponse(
      {
        user: {
          name: superAdmin.name,
          email: superAdmin.email,
          role: superAdmin.role,
        },
      },
      "Super Admin successfully created!",
      201
    );
  } catch (error) {
    return handleApiError(error, "GET /api/setup-admin");
  }
}