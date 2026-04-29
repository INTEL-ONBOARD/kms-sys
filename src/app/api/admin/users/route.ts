import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs'; 

export async function GET() {
  try {
    // 1. Connect to the MongoDB database
    await connectToDatabase();

    // 2. Fetch all users from the database
    // We use .select('-password') to ensure we don't send passwords to the frontend for security
    // .sort({ createdAt: -1 }) sorts the users so the newest ones appear first
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // 3. Return the users as a JSON response
    return NextResponse.json({ users }, { status: 200 });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
  }
}

// Add New User API (POST Request)
export async function POST(req: Request) {
  try {
    // 1. Get user data from the request body sent by the frontend modal
    const { name, email, password, role } = await req.json();

    // 2. Connect to the database
    await connectToDatabase();

    // 3. Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists with this email" }, { status: 400 });
    }

    // 4. Hash the password for security before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create the new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      status: 'active', 
      isActivated: true 
    });

    // 6. Return success response (excluding password just to be safe)
    return NextResponse.json(
      { 
        message: "User created successfully", 
        user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } 
      }, 
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ message: "Failed to create user" }, { status: 500 });
  }
}