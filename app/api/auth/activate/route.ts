import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    // 1. Get the activation token from the request body
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ message: 'Invalid activation link. Token is missing.' }, { status: 400 });
    }

    // 2. Connect to the database
    await connectToDatabase();

    // 3. Find the user associated with this activation token
    const user = await User.findOne({ activationToken: token });

    // 4. If no user is found, the token is invalid or already used
    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired activation link.' }, { status: 400 });
    }

    // 5. Activate the account by updating fields
    user.isActivated = true; 
    user.activationToken = undefined; 
    
    // 6. Save the updated user to the database
    await user.save();

    // 7. Return success response
    return NextResponse.json({ message: 'Account activated successfully!' }, { status: 200 });

  } catch (error) {
    console.error('Activation API Error:', error);
    return NextResponse.json({ message: 'An error occurred during activation.' }, { status: 500 });
  }
}