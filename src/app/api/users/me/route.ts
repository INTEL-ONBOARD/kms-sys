import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(token.sub).select("-password").lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { message: "Failed to fetch user profile", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      firstName,
      lastName,
      phone,
      email,
      dob,
      address,
      parentName,
      parentContact,
      department,
      expertise,
      qualification,
      linkedin,
      currentPassword,
      newPassword,
    } = body;

    await connectToDatabase();

    const user = await User.findById(token.sub);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: "Current password is required to set a new password." },
          { status: 400 }
        );
      }
      if (!user.password) {
        return NextResponse.json(
          { message: "You cannot change password for this account type." },
          { status: 400 }
        );
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { message: "Current password is incorrect." },
          { status: 400 }
        );
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Update allowed fields
    if (name !== undefined) user.name = name;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (email !== undefined) user.email = email.toLowerCase().trim();
    if (dob !== undefined) user.dob = dob;
    if (address !== undefined) user.address = address;
    if (parentName !== undefined) user.parentName = parentName;
    if (parentContact !== undefined) user.parentContact = parentContact;
    if (department !== undefined) user.department = department;
    if (expertise !== undefined) user.expertise = expertise;
    if (qualification !== undefined) user.qualification = qualification;
    if (linkedin !== undefined) user.linkedin = linkedin;

    await user.save();

    const updatedUser = await User.findById(token.sub).select("-password").lean();

    return NextResponse.json(
      { message: "Profile updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user profile:", error);
    const isDuplicate = String(error).includes("E11000");
    if (isDuplicate) {
      return NextResponse.json(
        { message: "Email already in use." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Failed to update profile", error: String(error) },
      { status: 500 }
    );
  }
}
