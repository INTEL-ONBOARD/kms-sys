import { NextRequest } from "next/server";
import { requireAuth } from "@/server/core/auth-context";
import { successResponse, handleApiError } from "@/server/core/api-response";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const body = await req.json();
    const { otp } = body;
    
    if (!otp) {
      throw new Error("OTP is required");
    }
    
    await connectToDatabase();
    
    const user = await User.findById(authUser.id);
    if (!user) {
      throw new Error("User not found");
    }
    
    if (!user.phone) {
      throw new Error("Phone number not found in profile");
    }
    
    // Find the OTP record
    const otpRecord = await Otp.findOne({ phone: user.phone, otp: otp });
    
    if (!otpRecord) {
      throw new Error("Invalid or expired OTP");
    }
    
    // Update user
    user.isMobileVerified = true;
    await user.save();
    
    // Delete OTP
    await Otp.deleteOne({ _id: otpRecord._id });
    
    return successResponse({ user }, "Mobile number verified successfully", 200);
  } catch (error) {
    return handleApiError(error, "POST /api/profile/verify-mobile-otp");
  }
}
