import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db'; // Import the DB connection function
import User from '@/models/User'; 

export async function POST(req: Request) {
  try {
    // 1. Extract data from the request body sent by the frontend
    const { fullName, email, password } = await req.json();

    // 2. Validate that all required fields are provided
    if (!fullName || !email || !password) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    // 3. Establish a connection to the MongoDB database
    await connectToDatabase();

    // 4. Check if a user with this email already exists in the database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'Email is already registered.' }, { status: 400 });
    }

    // 5. Hash the password securely using bcrypt with a salt round of 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Create a new user document in the database
    // Note: Mapping 'fullName' from frontend to 'name' in the User schema
    await User.create({
      name: fullName, 
      email,
      password: hashedPassword,
    });

    // 7. Return a success response back to the frontend
    return NextResponse.json({ message: 'Student registered successfully!' }, { status: 201 });

  } catch (error) {
    console.error('Signup API Error:', error);
    // Return an error response if something goes wrong during the process
    return NextResponse.json({ message: 'An error occurred during registration.' }, { status: 500 });
  }
}