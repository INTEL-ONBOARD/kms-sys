import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { BadRequestError, ForbiddenError } from "@/server/core/errors";

export async function GET(req: NextRequest) {
  try {
    const setupSecretEnv = process.env.ADMIN_SETUP_SECRET;
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && !setupSecretEnv) {
      throw new ForbiddenError("Admin setup route is disabled in production.");
    }

    const { searchParams } = new URL(req.url);
    const reqSecret =
      req.headers.get("x-setup-secret") ||
      req.headers.get("x-admin-setup-secret") ||
      searchParams.get("secret") ||
      searchParams.get("setupSecret") ||
      searchParams.get("adminSecret") ||
      (req.headers.get("authorization")?.startsWith("Bearer ")
        ? req.headers.get("authorization")?.slice(7)
        : null);

    if (setupSecretEnv) {
      if (!reqSecret || reqSecret !== setupSecretEnv) {
        throw new ForbiddenError("Invalid or missing setup secret.");
      }
    }

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