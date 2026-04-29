import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import type { CourseInput } from "@/types/lms";

function validateCoursePayload(payload: Partial<CourseInput>) {
  if (!payload.title?.trim()) return "title is required";
  if (!payload.instructor?.trim()) return "instructor is required";
  return null;
}

export async function GET() {
  try {
    await connectToDatabase();
    const courses = await Course.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch courses", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<CourseInput>;
    const validationError = validateCoursePayload(payload);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    await connectToDatabase();
    const course = await Course.create({
      title: payload.title?.trim(),
      description: payload.description?.trim() || "",
      instructor: payload.instructor?.trim(),
      published: payload.published ?? false
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create course", error: String(error) },
      { status: 500 }
    );
  }
}
