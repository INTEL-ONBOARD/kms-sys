import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Otp from "@/lib/models/Otp";
import { sendOTP } from "@/lib/mailer";
import { successResponse, handleApiError } from "@/lib/core/api-response";
import { z } from "zod";

const sendOtpSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = sendOtpSchema.parse(body);

    await connectToDatabase();

    // Generate a 6-digit random OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any existing OTPs for this email to prevent spam/confusion
    await Otp.deleteMany({ email });

    // Save the new OTP
    await Otp.create({
      email,
      otp: otpCode,
    });

    // Send the OTP via email
    await sendOTP(email, otpCode);

    return successResponse(null, "OTP sent successfully");
  } catch (error) {
    return handleApiError(error, "POST /api/auth/send-otp");
  }
}
