import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

    // 6. If everything is correct, return success!
    
    return NextResponse.json(
      { 
        message: 'Login successful!', 
        user: { name: user.name, email: user.email, role: user.role } 
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ message: 'An error occurred during login.' }, { status: 500 });
  }
}