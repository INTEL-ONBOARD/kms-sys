import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose'; // Imported jose for JWT generation
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    // 1. Get email and password from the frontend
    const { email, password } = await req.json();

    // 2. Validate input
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    // 3. Connect to the database
    await connectToDatabase();

    // 4. Check if a user with this email exists
    const user = await User.findOne({ email });
    
    // If user doesn't exist, return an error
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    // 5. Compare the entered password with the hashed password in the database
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    // If passwords don't match, return an error
    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    // ---------------------------------------------------------
    // 6. NEW: Check if the user's account has been activated
    // ---------------------------------------------------------
    if (!user.isActivated) {
      return NextResponse.json(
        { message: 'Please check your email and activate your account before logging in.' }, 
        { status: 403 } // 403 Forbidden status indicates lack of permission
      );
    }

    // 7. Generate a JWT Token using the secret key (Only proceeds if account is activated)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const alg = 'HS256';

    const token = await new SignJWT({ 
      id: user._id.toString(), 
      email: user.email, 
      role: user.role // Save user role in the token
    })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('1d') // Token expires in 1 day
      .sign(secret);

    // 8. Create the response object
    const response = NextResponse.json(
      { 
        message: 'Login successful!', 
        user: { name: user.name, email: user.email, role: user.role } 
      }, 
      { status: 200 }
    );

    // 9. Set the token as an HTTP-only cookie for secure session handling
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true, // Prevents client-side JS from accessing the cookie (XSS protection)
      secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
      sameSite: 'strict', // CSRF protection
      maxAge: 60 * 60 * 24, // 1 day in seconds
      path: '/', // Cookie is accessible across the entire site
    });

    // 10. Return the response
    return response;

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ message: 'An error occurred during login.' }, { status: 500 });
  }
}