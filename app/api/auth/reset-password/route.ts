import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ message: 'Invalid request. Missing token or password.' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Find user with this token AND check if it hasn't expired
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() } 
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired password reset token.' }, { status: 400 });
    }

    // 2. Hash the new password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Update user details
    user.password = hashedPassword;
    
    // 4. Clear the reset token fields so they can't be used again
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Save the changes
    await user.save();

    return NextResponse.json({ message: 'Password has been reset successfully!' }, { status: 200 });

  } catch (error) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json({ message: 'An error occurred while resetting the password.' }, { status: 500 });
  }
}