import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ activationToken: token });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired activation link.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { needsPassword: !user.password },
      { status: 200 }
    );

  } catch (error) {
    console.error('Check Activation API Error:', error);
    return NextResponse.json(
      { message: 'An error occurred.' },
      { status: 500 }
    );
  }
}
