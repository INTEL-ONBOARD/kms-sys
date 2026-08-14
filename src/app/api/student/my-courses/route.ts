// src/app/api/student/my-courses/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Make sure only logged-in students can access this
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    // Auto-enroll student in all published courses so new courses appear automatically
    const publishedCourses = await Course.find({ published: true }).lean();
    let enrollments = await Enrollment.find({ userId: session.user.id }).lean();
    const enrolledCourseIds = new Set(enrollments.map((e: any) => e.courseId?.toString()).filter(Boolean));

    for (const pCourse of publishedCourses) {
      if (!enrolledCourseIds.has(pCourse._id.toString())) {
        try {
          await Enrollment.create({
            userId: session.user.id,
            courseId: pCourse._id,
            progress: 0,
          });
        } catch (e) {
          // Ignore duplicate enrollment error if concurrent
        }
      }
    }

    // Re-fetch populated enrollments for this specific student
    const updatedEnrollments = await Enrollment.find({ userId: session.user.id })
      .populate('courseId')
      .lean();

    // Format the data to send to the frontend
    const myCourses = updatedEnrollments
      .filter((e: any) => e.courseId) // Ensure course doc exists
      .map((enrollment: any) => ({
        ...enrollment.courseId,
        progress: enrollment.progress || 0,
        enrollmentId: enrollment._id,
      }));

    return NextResponse.json({ courses: myCourses }, { status: 200 });
  } catch (error) {
    console.error("Fetch Courses Error:", error);
    return NextResponse.json({ message: "Failed to fetch courses" }, { status: 500 });
  }
}