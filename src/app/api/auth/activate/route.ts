import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token) {
      return NextResponse.json(
        { message: 'Invalid activation link. Token is missing.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ activationToken: token });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired activation link. Your account might already be activated.' },
        { status: 400 }
      );
    }

    // If a password is provided (invite flow), hash and set it
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { message: 'Password must be at least 6 characters.' },
          { status: 400 }
        );
      }
      user.password = await bcrypt.hash(password, 10);
    }

    user.isActivated = true;
    user.activationToken = null;
    await user.save();

    return NextResponse.json(
      { message: 'Your account has been successfully activated! You can now log in.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Activation API Error:', error);
    return NextResponse.json(
      { message: 'An error occurred during account activation.' },
      { status: 500 }
    );
  }
}
