import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
import Otp from "@/lib/models/Otp";
import Batch from "@/lib/models/Batch";
import { BadRequestError, NotFoundError, ConflictError } from "@/lib/core/errors";
import {
  SignupInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ActivateAccountInput,
} from "@/types/dtos/auth.dto";

/**
 * Registers a new user/student.
 */
export async function signup(input: SignupInput) {
  await connectToDatabase();

  const otpRecord = await Otp.findOne({ email: input.email.toLowerCase(), otp: input.otp });
  if (!otpRecord) {
    throw new BadRequestError("Invalid or expired OTP.");
  }

  const existingUser = await User.findOne({ email: input.email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError("An account with this email address already exists.");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);
  const fullName = input.name || `${input.firstName || ""} ${input.lastName || ""}`.trim() || input.email.split("@")[0];

  const newUser = await User.create({
    ...input,
    name: fullName,
    email: input.email.toLowerCase(),
    password: hashedPassword,
    role: input.role || "student",
    status: "active",
    isActivated: true, // Direct signup accounts are auto-activated
  });

  await Otp.deleteOne({ _id: otpRecord._id });

  // --- Auto-Batching Logic ---
  if (newUser.role === "student") {
    let activeBatch = await Batch.findOne({ isActive: true });

    if (!activeBatch) {
      const batchCount = await Batch.countDocuments();
      activeBatch = await Batch.create({
        name: `Batch ${batchCount + 1}`,
        description: "Auto-generated batch",
        isActive: true,
        maxCapacity: 50,
        students: []
      });
    }

    activeBatch.students.push(newUser._id);

    if (activeBatch.students.length >= (activeBatch.maxCapacity || 50)) {
      activeBatch.isActive = false;
      await activeBatch.save();

      // Rollover: Create the next active batch immediately
      const batchCount = await Batch.countDocuments();
      await Batch.create({
        name: `Batch ${batchCount + 1}`,
        description: "Auto-generated batch",
        isActive: true,
        maxCapacity: 50,
        students: []
      });
    } else {
      await activeBatch.save();
    }
  }

  return {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  };
}

/**
 * Initiates a password reset request and generates a reset token.
 */
export async function forgotPassword(input: ForgotPasswordInput) {
  await connectToDatabase();

  const user = await User.findOne({ email: input.email.toLowerCase() });
  if (!user) {
    // For security reasons, do not reveal if user does not exist
    return { message: "If that email exists, a password reset link has been dispatched." };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 hour expiration
  await user.save();

  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
  console.log(`[Password Reset] Link for ${user.email}: ${resetUrl}`);

  return {
    message: "If that email exists, a password reset link has been dispatched.",
    resetToken,
  };
}

/**
 * Resets user password using a verified token.
 */
export async function resetPassword(input: ResetPasswordInput) {
  await connectToDatabase();

  const user = await User.findOne({
    resetPasswordToken: input.token,
    resetPasswordExpire: { $gt: new Date() },
  });

  if (!user) {
    throw new BadRequestError("Invalid or expired password reset token.");
  }

  user.password = await bcrypt.hash(input.password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return { message: "Password has been reset successfully. You can now log in." };
}

/**
 * Validates an account activation token.
 */
export async function checkActivation(token: string) {
  await connectToDatabase();

  const user = await User.findOne({ activationToken: token });
  if (!user) {
    throw new NotFoundError("Invalid or expired activation link.");
  }

  return {
    valid: true,
    email: user.email,
    name: user.name,
  };
}

/**
 * Activates an account by setting the initial password.
 */
export async function activateAccount(input: ActivateAccountInput) {
  await connectToDatabase();

  const user = await User.findOne({ activationToken: input.token });
  if (!user) {
    throw new BadRequestError("Invalid or expired activation token.");
  }

  user.password = await bcrypt.hash(input.password, 10);
  user.isActivated = true;
  user.status = "active";
  user.activationToken = undefined;
  await user.save();

  return { message: "Account activated successfully. You can now log in." };
}
