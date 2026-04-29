import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    // 1. Extract the activation token from the request body sent by the frontend
    const { token } = await req.json();

    // 2. Validate if the token was successfully received
    if (!token) {
      return NextResponse.json(
        { message: 'Invalid activation link. Token is missing.' }, 
        { status: 400 }
      );
    }

    // 3. Establish a connection to the MongoDB database
    await connectToDatabase();

    // 4. Find the user in the database who has this specific activation token
    const user = await User.findOne({ activationToken: token });

    // 5. If no user is found, the token is either invalid, tampered with, or already used
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired activation link. Your account might already be activated.' }, 
        { status: 400 }
      );
    }

    // 6. Update the user's status to activated
    user.isActivated = true; 
    
    // 7. Remove the activation token by setting it to null (aligns with schema default)
    user.activationToken = null; 
    
    // 8. Save the updated user document back to the database
    await user.save();

    // 9. Return a success response to the frontend
    return NextResponse.json(
      { message: 'Your account has been successfully activated! You can now log in.' }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Activation API Error:', error);
    // Return a generic server error response if something goes wrong
    return NextResponse.json(
      { message: 'An error occurred during account activation.' }, 
      { status: 500 }
    );
  }
}