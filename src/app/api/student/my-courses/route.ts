// src/app/api/student/my-courses/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course'; // Needed to populate course details

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Make sure only logged-in students can access this
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    // Find all enrollments for this specific student and populate the Course data
    const enrollments = await Enrollment.find({ userId: session.user.id })
      .populate('courseId')
      .lean();

    // Format the data to send to the frontend
    const myCourses = enrollments.map(enrollment => ({
      ...enrollment.courseId, // Course details (title, description, etc.)
      progress: enrollment.progress, // Student's specific progress
      enrollmentId: enrollment._id
    }));

    return NextResponse.json({ courses: myCourses }, { status: 200 });
  } catch (error) {
    console.error("Fetch Courses Error:", error);
    return NextResponse.json({ message: "Failed to fetch courses" }, { status: 500 });
  }
}