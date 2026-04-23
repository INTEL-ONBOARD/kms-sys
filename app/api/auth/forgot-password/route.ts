import { NextResponse } from 'next/server';
import crypto from 'crypto'; 
import nodemailer from 'nodemailer';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Check if the user exists
    const user = await User.findOne({ email });

    if (!user) {
      // For security, it's sometimes better to say "If an account exists, an email was sent."
      
      return NextResponse.json({ message: 'No account found with that email' }, { status: 404 });
    }

    // 2. Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 3. Set token and expiration (1 hour from now)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); 
    await user.save(); // Save the updated user to the database

    // 4. Create the password reset link

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // 5. Setup Nodemailer transport using Gmail App Password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 6. Define the email options
    const mailOptions = {
      from: `"Wise East University" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password for the Wise East University student portal. Please click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0066cc;">${resetUrl}</p>
          <p style="color: #777; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    // 7. Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Password reset link sent to your email.' }, { status: 200 });

  } catch (error) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json({ message: 'An error occurred while sending the email.' }, { status: 500 });
  }
}