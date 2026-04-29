import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Course from "@/models/Course";
import type { CourseInput } from "@/types/lms";

type RouteParams = {
  params: Promise<{ id: string }>;
};

function validateId(id: string) {
  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: "Invalid course id" }, { status: 400 });
  }
  return null;
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const invalid = validateId(id);
  if (invalid) return invalid;

  try {
    await connectToDatabase();
    const course = await Course.findById(id).lean();
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }
    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch course", error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const invalid = validateId(id);
  if (invalid) return invalid;

  try {
    const payload = (await request.json()) as Partial<CourseInput>;
    await connectToDatabase();

    const updates: Partial<CourseInput> = {};
    if (payload.title !== undefined) updates.title = payload.title.trim();
    if (payload.description !== undefined) updates.description = payload.description.trim();
    if (payload.instructor !== undefined) updates.instructor = payload.instructor.trim();
    if (payload.published !== undefined) updates.published = payload.published;

    const course = await Course.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).lean();

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update course", error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const invalid = validateId(id);
  if (invalid) return invalid;

  try {
    await connectToDatabase();
    const course = await Course.findByIdAndDelete(id).lean();
    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Course deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete course", error: String(error) },
      { status: 500 }
    );
  }
}
