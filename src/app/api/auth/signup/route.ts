import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; 
import { Resend } from 'resend'; 
import { connectToDatabase } from '@/lib/db'; 
import User from '@/models/User'; 

export async function POST(req: Request) {
  try {
    // 1. Extract all data from the request body sent by the Stepper frontend
    const { 
      role, firstName, lastName, phone, email, password,
      dob, address, parentName, parentContact, // Student specific fields
      department, expertise, qualification, linkedin // Lecturer specific fields
    } = await req.json();

    // 2. Validate that all common required fields are provided
    if (!role || !firstName?.trim() || !lastName?.trim() || !phone?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ message: 'Common required fields are missing.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 3. Establish a connection to the MongoDB database
    await connectToDatabase();

    // 4. Check if a user with this email already exists in the database
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ message: 'Email is already registered.' }, { status: 409 });
    }

    // 5. Hash the password securely using bcrypt with a salt round of 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Generate a secure random activation token
    const activationToken = crypto.randomBytes(32).toString('hex');

    // 7. Combine firstName and lastName for the required 'name' field
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Check if Resend API key is configured
    const hasResendApiKey = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '');

    // 8. Create a new user document in the database
    const newUser = await User.create({
      name: fullName, 
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      status: 'active',
      isActivated: !hasResendApiKey, // Auto-activate if no email service is configured
      activationToken: hasResendApiKey ? activationToken : null,
      
      // Conditionally add student fields if the role is student
      ...(role === 'student' && { dob, address, parentName, parentContact }),
      
      // Conditionally add lecturer fields if the role is lecturer
      ...(role === 'lecturer' && { department, expertise, qualification, linkedin }),
    });

    // 9. If Resend is configured, attempt sending activation email
    if (hasResendApiKey) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const activationUrl = `${baseUrl}/activate?token=${activationToken}`;

      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error } = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: normalizedEmail,
          subject: 'Activate Your Account - Wise East University',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #333;">Welcome to Wise East University!</h2>
              <p>Hello ${firstName.trim()},</p>
              <p>Thank you for registering as a ${role}. To complete your setup and access the portal, please activate your account by clicking the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${activationUrl}" style="background-color: #b7ff00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Activate Account</a>
              </div>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #0066cc;">${activationUrl}</p>
            </div>
          `,
        });

        if (error) {
          console.error('Resend API Error:', error);
          // If email fails, auto-activate user so they are not blocked
          newUser.isActivated = true;
          newUser.activationToken = null;
          await newUser.save();
          return NextResponse.json(
            { message: 'Registration successful! Account auto-activated (email service error).' }, 
            { status: 201 }
          );
        }

        return NextResponse.json(
          { message: 'Registration successful! Please check your email to activate your account.' }, 
          { status: 201 }
        );
      } catch (emailErr) {
        console.error('Failed to send email:', emailErr);
        newUser.isActivated = true;
        newUser.activationToken = null;
        await newUser.save();
        return NextResponse.json(
          { message: 'Registration successful! Account auto-activated.' }, 
          { status: 201 }
        );
      }
    }

    // 10. Return success response when Resend is not configured (auto-activated)
    return NextResponse.json(
      { message: 'Registration successful! You can now log in.' }, 
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup API Error:', error);
    return NextResponse.json({ message: 'An error occurred during registration.' }, { status: 500 });
  }
}