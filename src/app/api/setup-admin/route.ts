import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // Connect to the database
    await connectToDatabase();

    // Check if a Super Admin already exists in the system
    const adminExists = await User.findOne({ role: "super_admin" });
    
    if (adminExists) {
      return NextResponse.json(
        { message: "Super Admin account already exists!" }, 
        { status: 400 }
      );
    }

    // Hash the secure password for the admin
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("Admin@2026", salt);

    // Create the Super Admin user document
    const superAdmin = await User.create({
      name: "System Admin",
      email: "admin@wiseeast.edu", 
      password: hashedPassword,
      role: "super_admin",
      status: "active",
      isActivated: true 
    });

    return NextResponse.json({
      message: "Super Admin successfully created!",
      user: {
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating Super Admin:", error);
    return NextResponse.json(
      { message: "Failed to create Super Admin", error: String(error) }, 
      { status: 500 }
    );
  }
}