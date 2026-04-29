import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    await connectToDatabase();
    const users = await User.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch users", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      name?: string;
      email?: string;
      role?: "student" | "instructor" | "admin";
    };

    if (!payload.name?.trim() || !payload.email?.trim()) {
      return NextResponse.json({ message: "name and email are required" }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.create({
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      role: payload.role ?? "student"
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    const isDuplicate = String(error).includes("E11000");
    if (isDuplicate) {
      return NextResponse.json({ message: "Email already exists" }, { status: 409 });
    }

    return NextResponse.json(
      { message: "Failed to create user", error: String(error) },
      { status: 500 }
    );
  }
}
