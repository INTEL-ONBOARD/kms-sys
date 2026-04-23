import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; 
import nodemailer from 'nodemailer'; 
import { connectToDatabase } from '@/lib/db'; 
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

    // 6. Generate a secure random activation token
    const activationToken = crypto.randomBytes(32).toString('hex');

    // 7. Create a new user document in the database
    // Note: Mapping 'fullName' from frontend to 'name' in the User schema
    // isActivated is automatically set to false by the schema default
    await User.create({
      name: fullName, 
      email,
      password: hashedPassword,
      activationToken: activationToken, // Save the token for email verification
    });

    // 8. Create the activation link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const activationUrl = `${baseUrl}/activate?token=${activationToken}`;

    // 9. Setup Nodemailer transport using Gmail App Password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 10. Define the email options
    const mailOptions = {
      from: `"Wise East University" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Activate Your Account - Wise East University',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Welcome to Wise East University!</h2>
          <p>Hello ${fullName},</p>
          <p>Thank you for registering. To complete your setup and access the student portal, please activate your account by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${activationUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Activate Account</a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0066cc;">${activationUrl}</p>
        </div>
      `,
    };

    // 11. Send the email
    await transporter.sendMail(mailOptions);

    // 12. Return a success response back to the frontend
    return NextResponse.json(
      { message: 'Registration successful! Please check your email to activate your account.' }, 
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup API Error:', error);
    // Return an error response if something goes wrong during the process
    return NextResponse.json({ message: 'An error occurred during registration.' }, { status: 500 });
  }
}