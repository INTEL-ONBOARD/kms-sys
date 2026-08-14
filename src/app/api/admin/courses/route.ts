import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Course from '@/models/Course';
import type { CourseInput } from '@/types/lms';

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
    const body = (await req.json()) as Partial<CourseInput>;
    await connectToDatabase();

    // Explicitly extract all supported fields (including new schedule & colorCode)
    const newCourse = await Course.create({
      title:       body.title?.trim(),
      description: body.description?.trim() || "",
      instructor:  body.instructor?.trim(),
      category:    body.category?.trim() || "Design",
      price:       body.price?.trim() || "Free",
      status:      body.status || "draft",
      published:   body.published ?? false,
      colorCode:   body.colorCode?.trim() || "#5A67D8",
      // Filter out incomplete slots (must have dayOfWeek + startTime + endTime)
      schedule: (body.schedule ?? []).filter(
        (s) => s.dayOfWeek && s.startTime && s.endTime
      ),
      enrollments: 0,
    });

    return NextResponse.json(
      { message: "Course created", course: newCourse },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ message: "Failed to create course" }, { status: 500 });
  }
}