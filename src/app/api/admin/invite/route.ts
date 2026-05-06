import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, role } = await req.json();

    if (!name?.trim() || !email?.trim() || !role) {
      return NextResponse.json(
        { message: 'Name, email, and role are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: 'A user with this email already exists.' },
        { status: 409 }
      );
    }

    const activationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status: 'active',
      isActivated: false,
      activationToken,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const activationUrl = `${baseUrl}/activate?token=${activationToken}`;

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'You have been invited to Wise East University',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Welcome to Wise East University!</h2>
          <p>Hello ${name.trim()},</p>
          <p>You have been invited to join the Wise East University portal as a <strong>${role}</strong>.</p>
          <p>To get started, please activate your account by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationUrl}" style="background-color: #5A67D8; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Activate Account</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0066cc;">${activationUrl}</p>
          <p style="color: #777; font-size: 12px; margin-top: 30px;">This invitation link does not expire. After activating, you will be prompted to set your password.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      await User.findByIdAndDelete(newUser._id);
      return NextResponse.json(
        { message: 'Failed to send invitation email.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Invitation sent successfully.', userId: newUser._id },
      { status: 201 }
    );

  } catch (error) {
    console.error('Invite API Error:', error);
    return NextResponse.json(
      { message: 'An error occurred while sending the invitation.' },
      { status: 500 }
    );
  }
}
