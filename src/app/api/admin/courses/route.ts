import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Course from '@/models/Course';

export async function GET() {
  try {
    await connectToDatabase();
    // Fetch all courses, newest first
    const courses = await Course.find().sort({ createdAt: -1 });
    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    // Create new course (enrollments default to 0)
    const newCourse = await Course.create({ ...body, enrollments: 0 });
    return NextResponse.json({ message: "Course created", course: newCourse }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create course" }, { status: 500 });
  }
}