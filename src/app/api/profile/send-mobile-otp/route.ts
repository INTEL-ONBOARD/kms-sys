import { NextRequest } from "next/server";
import { requireAuth } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await connectToDatabase();
    
    const user = await User.findById(authUser.id);
    if (!user) {
      throw new Error("User not found");
    }
    
    if (!user.phone) {
      throw new Error("Phone number not found in profile");
    }
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to database
    await Otp.create({
      phone: user.phone,
      otp: otp
    });
    
    console.log(`Sending SMS OTP: ${otp} to phone number: ${user.phone}`);
    
    return successResponse({}, "OTP sent successfully", 200);
  } catch (error) {
    return handleApiError(error, "POST /api/profile/send-mobile-otp");
  }
}
